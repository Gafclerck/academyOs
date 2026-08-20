from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cohorts.models import Enrollment
from apps.users.permissions import IsAdmin

from .models import Certificate
from .serializers import CertificateSerializer, CertificatePublicSerializer
from .services import generate_certificate


class MyCertificatesView(APIView):
    """GET /api/v1/certificates/me/ -- liste les certificats de l'apprenant connecté."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        certificates = Certificate.objects.filter(
            inscription__user=request.user
        ).select_related("inscription__cohort__program")
        serializer = CertificateSerializer(certificates, many=True)
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
    """POST /api/v1/certificates/generate/ -- déclenchement manuel par l'admin.

    Attend un champ enrollment_id dans le corps de la requête. Crée le
    certificat lié (statut EN_ATTENTE) s'il n'existe pas déjà, ou renvoie
    le certificat existant sans le dupliquer. La génération du PDF et
    l'envoi de l'email sont branchés dans une étape ultérieure.
    """

    permission_classes = [IsAdmin]

    def post(self, request):
        enrollment_id = request.data.get("enrollment_id")
        if not enrollment_id:
            return Response(
                {"detail": "Le champ enrollment_id est requis."},
                status=400,
            )

        enrollment = get_object_or_404(Enrollment, pk=enrollment_id)
        certificate, created = generate_certificate(enrollment)
        serializer = CertificateSerializer(certificate)

        return Response(
            serializer.data,
            status=201 if created else 200,
        )
