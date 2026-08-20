from uuid import UUID

from django.db import models
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cohorts.models import TrainerAssignment
from apps.evaluations.models import Deliverable, ProjectAssignment
from apps.evaluations.serializers import (
    DeliverableReviewSerializer,
    DeliverableSerializer,
    DeliverableSubmitSerializer,
    ProjectAssignmentCreateSerializer,
    ProjectAssignmentSerializer,
)
from apps.evaluations.services import review_deliverable, submit_deliverable
from apps.users.models import User
from apps.users.permissions import IsAdmin, IsAdminOrOrganizerOrTrainer, IsAdminOrTrainer


@extend_schema_view(
    list=extend_schema(
        summary="Lister les assignations de projet",
        description="Liste paginée des assignations de projet. Filtrable par cohorte, projet, utilisateur et statut.",
        parameters=[
            OpenApiParameter("cohort", str, OpenApiParameter.QUERY, description="Filtrer par UUID de cohorte."),
            OpenApiParameter("project", str, OpenApiParameter.QUERY, description="Filtrer par UUID de projet."),
            OpenApiParameter("user", str, OpenApiParameter.QUERY, description="Filtrer par UUID d'apprenant."),
            OpenApiParameter("status", str, OpenApiParameter.QUERY, description="Filtrer par statut ('pending', 'in_progress', 'submitted', 'validated')."),
        ],
        tags=["Evaluations"],
    ),
    create=extend_schema(summary="Créer une assignation de projet", tags=["Evaluations"]),
    retrieve=extend_schema(summary="Détail d'une assignation de projet", tags=["Evaluations"]),
    update=extend_schema(summary="Modifier une assignation de projet (admin uniquement)", tags=["Evaluations"]),
    partial_update=extend_schema(summary="Modifier partiellement une assignation (admin uniquement)", tags=["Evaluations"]),
    destroy=extend_schema(summary="Supprimer une assignation de projet (admin uniquement)", tags=["Evaluations"]),
)
class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des assignations de projets aux apprenants."""

    queryset = (
        ProjectAssignment.objects.select_related(
            "enrollment__user",
            "enrollment__cohort",
            "project",
        )
        .prefetch_related(
            "deliverables__attachments",
            "deliverables__submitted_by",
            "deliverables__reviewed_by",
        )
        .all()
    )

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        if self.action == "create":
            return [IsAdminOrOrganizerOrTrainer()]
        # update, partial_update, destroy : admin uniquement
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectAssignmentCreateSerializer
        return ProjectAssignmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        output = ProjectAssignmentSerializer(assignment, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filtrage selon le rôle : un learner ne voit que ses propres assignations
        if user.role == User.Role.LEARNER and not user.is_staff:
            queryset = queryset.filter(enrollment__user_id=user.id)
        elif user.role == User.Role.TRAINER and not user.is_staff:
            # Un formateur voit les assignations des cohortes auxquelles il est affecté
            queryset = queryset.filter(enrollment__cohort__trainer_assignments__user_id=user.id).distinct()

        cohort_param = self.request.query_params.get("cohort")
        if cohort_param:
            try:
                cohort_uuid = UUID(cohort_param)
            except ValueError:
                raise ValidationError({"cohort": ["UUID invalide."]})
            queryset = queryset.filter(enrollment__cohort_id=cohort_uuid)

        project_param = self.request.query_params.get("project")
        if project_param:
            try:
                project_uuid = UUID(project_param)
            except ValueError:
                raise ValidationError({"project": ["UUID invalide."]})
            queryset = queryset.filter(project_id=project_uuid)

        user_param = self.request.query_params.get("user")
        if user_param:
            try:
                user_uuid = UUID(user_param)
            except ValueError:
                raise ValidationError({"user": ["UUID invalide."]})
            queryset = queryset.filter(enrollment__user_id=user_uuid)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset


class DeliverableSubmitView(APIView):
    """POST /api/v1/evaluations/assignments/<assignment_id>/deliverables/ - Soumettre un livrable (apprenant)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        summary="Soumettre un livrable pour un projet",
        description="Permet à l'apprenant assigné de déposer un livrable (liens repo/demo, commentaires, fichiers joints).",
        request={
            "application/json": DeliverableSubmitSerializer,
            "multipart/form-data": DeliverableSubmitSerializer,
        },
        responses={201: DeliverableSerializer},
        tags=["Evaluations"],
    )
    def post(self, request, assignment_id):
        assignment = get_object_or_404(ProjectAssignment, pk=assignment_id)
        serializer = DeliverableSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        deliverable = submit_deliverable(
            assignment=assignment,
            user=request.user,
            data=serializer.validated_data,
            files=files,
        )

        output = DeliverableSerializer(deliverable, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class DeliverableListView(generics.ListAPIView):
    """GET /api/v1/evaluations/assignments/<id>/deliverables/ - Lister les livrables d'une assignation."""

    serializer_class = DeliverableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assignment = get_object_or_404(ProjectAssignment, pk=self.kwargs["assignment_id"])
        user = self.request.user
        if user.role == User.Role.LEARNER and not user.is_staff:
            if assignment.enrollment.user_id != user.id:
                raise PermissionDenied("Vous n'avez pas accès aux livrables de cette assignation.")
        elif user.role == User.Role.TRAINER and not user.is_staff:
            if not TrainerAssignment.objects.filter(
                cohort=assignment.enrollment.cohort, user=user
            ).exists():
                raise PermissionDenied(
                    "Vous n'êtes pas formateur affecté à la cohorte de cette assignation."
                )
        return Deliverable.objects.filter(assignment=assignment).select_related(
            "assignment__project",
            "assignment__enrollment__user",
            "assignment__enrollment__cohort",
            "submitted_by",
            "reviewed_by",
        ).prefetch_related("attachments")

    @extend_schema(
        summary="Lister les livrables d'une assignation",
        description="Retourne la liste versionnée des livrables soumis pour une assignation donnée.",
        responses={200: DeliverableSerializer(many=True)},
        tags=["Evaluations"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DeliverableReviewView(APIView):
    """POST /api/v1/evaluations/deliverables/<deliverable_id>/review/ - Corriger et noter un livrable (formateur/admin)."""

    permission_classes = [IsAdminOrTrainer]
    parser_classes = [JSONParser]

    @extend_schema(
        summary="Corriger et évaluer un livrable",
        description="Permet à un formateur ou administrateur de valider/rejeter un livrable, d'attribuer une note et un feedback.",
        request=DeliverableReviewSerializer,
        responses={200: DeliverableSerializer},
        tags=["Evaluations"],
    )
    def post(self, request, deliverable_id):
        deliverable = get_object_or_404(Deliverable, pk=deliverable_id)

        # Un formateur ne peut reviewer que les livrables de SA cohorte
        if request.user.role == User.Role.TRAINER and not request.user.is_staff:
            cohort = deliverable.assignment.enrollment.cohort
            if not TrainerAssignment.objects.filter(
                cohort=cohort, user=request.user
            ).exists():
                raise PermissionDenied(
                    "Vous n'êtes pas formateur affecté à la cohorte de ce livrable."
                )

        serializer = DeliverableReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status_decision = serializer.validated_data["status"]
        score = serializer.validated_data["score"]
        feedback = serializer.validated_data.get("feedback", "")

        reviewed = review_deliverable(
            deliverable=deliverable,
            trainer=request.user,
            status_decision=status_decision,
            score=score,
            feedback=feedback,
        )

        output = DeliverableSerializer(reviewed, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


class DeliverableDetailView(generics.RetrieveAPIView):
    """GET /api/v1/evaluations/deliverables/<deliverable_id>/ - Détail d'un livrable."""

    queryset = Deliverable.objects.select_related(
        "assignment__project",
        "assignment__enrollment__user",
        "assignment__enrollment__cohort",
        "submitted_by",
        "reviewed_by",
    ).prefetch_related("attachments")
    serializer_class = DeliverableSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Détail d'un livrable", tags=["Evaluations"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user.is_staff:
            return obj
        if user.role == User.Role.LEARNER:
            if obj.assignment.enrollment.user_id != user.id:
                raise PermissionDenied("Vous n'avez pas accès à ce livrable.")
        elif user.role == User.Role.TRAINER:
            cohort = obj.assignment.enrollment.cohort
            if not TrainerAssignment.objects.filter(
                cohort=cohort, user=user
            ).exists():
                raise PermissionDenied(
                    "Vous n'êtes pas formateur affecté à la cohorte de ce livrable."
                )
        return obj
