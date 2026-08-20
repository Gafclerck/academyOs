from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdmin

from .models import Certificate
from .serializers import CertificateSerializer, CertificatePublicSerializer


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

    Logique de génération (service PDF + tâche Celery) à brancher à l'étape suivante.
    """

    permission_classes = [IsAdmin]

    def post(self, request):
        return Response({"detail": "Not implemented yet"}, status=501)
