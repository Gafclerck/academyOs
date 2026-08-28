from uuid import UUID

from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.cohorts.models import Enrollment
from apps.core.pagination import DefaultPagination
from apps.users.permissions import IsAdmin, IsAdminOrOrganizer

from .models import Certificate
from .serializers import (
    CertificateAdminSerializer,
    CertificatePublicSerializer,
    CertificateSerializer,
)
from .services import generate_certificate
from .tasks import send_certificate_email_task


class MyCertificatesView(APIView):
    """GET /api/v1/certificates/me/ -- liste les certificats de l'apprenant connecté."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        certificates = Certificate.objects.filter(
            inscription__user=request.user
        ).select_related("inscription__cohort__program")
        serializer = CertificateSerializer(
            certificates, many=True, context={"request": request}
        )
        return Response(serializer.data)


class CertificateDetailView(APIView):
    """GET /api/v1/certificates/{id}/ -- vérification publique d'un certificat.

    Accessible sans authentification. Seuls les certificats déjà envoyés
    (statut ENVOYE) sont retournés : un certificat en attente n'est pas
    encore officiellement émis et ne doit pas être vérifiable.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        certificate = get_object_or_404(
            Certificate.objects.select_related(
                "inscription__user", "inscription__cohort__program"
            ),
            pk=pk,
            status=Certificate.StatusCertificateEnum.SENT,
        )
        serializer = CertificatePublicSerializer(certificate)
        return Response(serializer.data)


class GenerateCertificateView(APIView):
    """POST /api/v1/certificates/generate/ -- déclenchement manuel par un
    admin ou un organisateur.

    Attend un champ enrollment_id dans le corps de la requête. Crée le
    certificat lié (statut EN_ATTENTE) s'il n'existe pas déjà, ou renvoie
    le certificat existant sans le dupliquer. Déclenche la tâche Celery
    d'envoi d'email uniquement pour un certificat nouvellement créé, pas
    pour un appel redondant sur un certificat existant.
    """

    permission_classes = [IsAdminOrOrganizer]

    def post(self, request):
        enrollment_id = request.data.get("enrollment_id")
        if not enrollment_id:
            return Response(
                {"detail": "Le champ enrollment_id est requis."},
                status=400,
            )

        enrollment = get_object_or_404(Enrollment, pk=enrollment_id)
        certificate, created = generate_certificate(enrollment)

        if created:
            send_certificate_email_task.delay(str(certificate.id))

        serializer = CertificateSerializer(certificate)

        return Response(
            serializer.data,
            status=201 if created else 200,
        )


class CertificateAdminListView(APIView):
    """GET /api/v1/certificates/ -- liste paginée (admin / organisateur).

    Expose la file des certificats avec les informations de l'apprenant
    et du contexte (programme/cohorte). Filtres combinables : `status`
    (EN_ATTENTE | ENVOYE), `program` (UUID), `cohort` (UUID) et `search`
    (nom ou email de l'apprenant).
    """

    permission_classes = [IsAdminOrOrganizer]

    @extend_schema(
        summary="List certificates (admin/organizer)",
        description="Liste paginée des certificats avec filtres status/program/cohort/search.",
        tags=["Certificates"],
    )
    def get(self, request):
        queryset = Certificate.objects.select_related(
            "inscription__user",
            "inscription__cohort__program",
            "sent_by",
        )

        raw_status = request.query_params.get("status")
        if raw_status:
            queryset = queryset.filter(status=raw_status)

        for param, field in (("program", "inscription__cohort__program_id"), ("cohort", "inscription__cohort_id")):
            raw = request.query_params.get(param)
            if raw:
                queryset = queryset.filter(**{field: self._parse_uuid(raw, param)})

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(inscription__user__first_name__icontains=search)
                | Q(inscription__user__last_name__icontains=search)
                | Q(inscription__user__email__icontains=search)
            )

        paginator = DefaultPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = CertificateAdminSerializer(
            page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)

    @staticmethod
    def _parse_uuid(raw, param):
        try:
            return UUID(raw)
        except ValueError:
            raise ValidationError({param: ["Invalid UUID."]})


class CertificateSendView(APIView):
    """POST /api/v1/certificates/send/ -- envoi groupé (admin / organisateur).

    Corps : {"ids": [<uuid>, ...]}. Chaque certificat en attente déclenche
    la tâche d'envoi d'email (réutilisée) et est renseigné sent_by=l'acteur
    connecté. Les certificats déjà envoyés sont ignorés (skipped). Chaque
    item est traité isolément : un échec n'empêche pas le reste du lot.
    """

    permission_classes = [IsAdminOrOrganizer]

    def get_throttles(self):
        throttle = ScopedRateThrottle()
        throttle.scope = "enroll"
        return [throttle]

    @extend_schema(
        summary="Send pending certificates (admin/organizer)",
        description="Envoie les certificats en attente par lot d'ids, résultat individuel par id.",
        tags=["Certificates"],
    )
    def post(self, request):
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Le champ ids (liste d'UUID) est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        certificates = {
            str(c.id): c
            for c in Certificate.objects.filter(id__in=ids).select_related(
                "inscription__user"
            )
        }

        results = []
        for raw_id in ids:
            cert = certificates.get(str(raw_id))
            if cert is None:
                results.append({"id": str(raw_id), "ok": False, "status": "not_found"})
                continue
            if cert.status == Certificate.StatusCertificateEnum.SENT:
                results.append({"id": str(cert.id), "ok": False, "status": "skipped"})
                continue
            try:
                # Marque l'envoi synchroniquement (idempotence : évite un
                # double envoi si la tâche est redéclenchée) et renseigne
                # l'acteur ; l'email et date_envoi sont posés par la tâche.
                cert.status = Certificate.StatusCertificateEnum.SENT
                cert.sent_by = request.user
                cert.save(update_fields=["status", "sent_by", "updated_at"])
                send_certificate_email_task.delay(str(cert.id))
                results.append({"id": str(cert.id), "ok": True, "status": "sent"})
            except Exception:
                results.append(
                    {"id": str(cert.id), "ok": False, "status": "error"}
                )

        return Response({"results": results})
