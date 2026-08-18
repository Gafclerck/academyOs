from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Attachment
from .serializers import AttachmentSerializer, AttachmentUploadSerializer


@extend_schema(
    summary="Upload an attachment",
    description="Upload multipart/form-data, champ 'file'. Le fichier est stocké "
    "sous un nom UUID ; le nom original est conservé dans original_filename. "
    "La réponse renvoie le détail complet de l'attachment créé.",
    request=AttachmentUploadSerializer,
    responses={201: AttachmentSerializer},
    tags=["Attachments"],
)
class AttachmentUploadView(generics.CreateAPIView):
    """POST /api/v1/attachments/ - upload multipart/form-data, champ 'file'."""

    queryset = Attachment.objects.all()
    serializer_class = AttachmentUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        return serializer.save(uploaded_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachment = self.perform_create(serializer)
        output = AttachmentSerializer(attachment, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


@extend_schema(
    summary="Retrieve or delete an attachment",
    description="Règle simple pour l'instant (Attachment pas encore lié à "
    "Deliverable/Project) : seul l'auteur de l'upload ou un admin peut "
    "consulter/supprimer. La matrice RBAC complète sera appliquée une fois le "
    "lien métier posé.",
    tags=["Attachments"],
)
class AttachmentDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/v1/attachments/<id>/"""

    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == "admin":
            return Attachment.objects.all()
        return Attachment.objects.filter(uploaded_by=user)
