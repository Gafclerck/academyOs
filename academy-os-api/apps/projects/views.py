from uuid import UUID

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models, transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.attachments.models import Attachment
from apps.attachments.serializers import AttachmentSerializer, AttachmentUploadSerializer
from apps.attachments.services import create_attachments
from apps.users.permissions import IsAdmin

from .models import Project
from .serializers import ProjectSerializer


@extend_schema_view(
    list=extend_schema(
        summary="Lister les projets",
        description="Liste paginée des projets. Filtrable par `program` (UUID), `status` ('draft' / 'published') et recherche textuelle `search`.",
        parameters=[
            OpenApiParameter(
                name="program",
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description="Filtrer par UUID du programme parent.",
            ),
            OpenApiParameter(
                name="status",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filtrer par statut ('draft' ou 'published').",
            ),
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Recherche insensible à la casse sur le titre ou la description.",
            ),
        ],
        tags=["Projects"],
    ),
    create=extend_schema(summary="Créer un projet", tags=["Projects"]),
    retrieve=extend_schema(summary="Détail d'un projet", tags=["Projects"]),
    update=extend_schema(summary="Modifier un projet", tags=["Projects"]),
    partial_update=extend_schema(
        summary="Modifier partiellement un projet",
        tags=["Projects"],
    ),
    destroy=extend_schema(summary="Supprimer un projet", tags=["Projects"]),
)
class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD pour les projets.

    - Lecture (list, retrieve) : tous les utilisateurs authentifiés.
      Étudiants, mentors et gestionnaires doivent pouvoir consulter
      les projets sur lesquels ils travaillent.
    - Écriture (create, update, partial_update, destroy) : administrateurs uniquement.
    """

    queryset = Project.objects.select_related("program").prefetch_related("attachments").all()
    serializer_class = ProjectSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Retourne les permissions adaptées à l'action en cours."""
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        with transaction.atomic():
            project = serializer.save()
            files = self.request.FILES.getlist("files")
            if files:
                try:
                    create_attachments(self.request.user, files, parent=project)
                except DjangoValidationError as exc:
                    raise ValidationError(detail=exc.message_dict if hasattr(exc, 'message_dict') else exc.messages) from exc
        if project.status == Project.StatusProjectEnum.PUBLISHED:
            from apps.evaluations.services import create_assignments_for_project
            create_assignments_for_project(project)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        project = serializer.save()
        if (
            old_status != Project.StatusProjectEnum.PUBLISHED
            and project.status == Project.StatusProjectEnum.PUBLISHED
        ):
            from apps.evaluations.services import create_assignments_for_project
            create_assignments_for_project(project)

    def get_queryset(self):
        queryset = super().get_queryset()

        program_param = self.request.query_params.get("program")
        if program_param:
            try:
                parsed_uuid = UUID(program_param)
            except ValueError:
                raise ValidationError({"program": ["Invalid UUID."]})
            queryset = queryset.filter(program_id=parsed_uuid)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search)
                | models.Q(description__icontains=search)
            )

        return queryset


class ProjectAttachmentView(APIView):
    """Gestion des pièces jointes d'un projet (liste + upload)."""

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    @extend_schema(
        summary="Lister les pièces jointes d'un projet",
        description="Retourne la liste de toutes les pièces jointes rattachées au projet spécifié.",
        responses={200: AttachmentSerializer(many=True)},
        tags=["Projects"],
    )
    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        attachments = project.attachments.all()
        output = AttachmentSerializer(attachments, many=True, context={"request": request})
        return Response(output.data)

    @extend_schema(
        summary="Ajouter une pièce jointe à un projet",
        description="Téléverse un fichier (multipart/form-data, champ 'file') et le rattache au projet spécifié.",
        request=AttachmentUploadSerializer,
        responses={201: AttachmentSerializer},
        tags=["Projects"],
    )
    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        serializer = AttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data["file"]
        attachments = create_attachments(request.user, [file_obj], parent=project)
        output = AttachmentSerializer(attachments[0], context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class ProjectAttachmentDeleteView(APIView):
    """DELETE /api/v1/projects/<project_id>/attachments/<attachment_id>/ - Supprimer une pièce jointe d'un projet."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Supprimer une pièce jointe d'un projet",
        description="Supprime définitivement la pièce jointe spécifiée du projet.",
        responses={204: None},
        tags=["Projects"],
    )
    def delete(self, request, project_id, attachment_id):
        project = get_object_or_404(Project, pk=project_id)
        attachment = get_object_or_404(
            Attachment,
            pk=attachment_id,
            content_type=ContentType.objects.get_for_model(Project),
            object_id=project.id,
        )
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
