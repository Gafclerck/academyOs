from uuid import UUID

from django.db import models
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cohorts.models import Cohort, TrainerAssignment
from apps.evaluations.models import Deliverable, EvaluationCriterion, ProjectAssignment
from apps.evaluations.permissions import CanGradeEvaluation, CanSubmitDeliverable, CanViewCohortStats, CanViewEvaluation
from apps.evaluations.serializers import (
    CohortStatsSerializer,
    DashboardStatsSerializer,
    DeliverableReviewSerializer,
    DeliverableSerializer,
    DeliverableSubmitSerializer,
    EvaluationCriterionSerializer,
    ProjectAssignmentCreateSerializer,
    ProjectAssignmentSerializer,
)
from apps.evaluations.services import (
    get_cohort_stats,
    get_dashboard_stats,
    review_deliverable,
    submit_deliverable,
)
from apps.users.models import User
from apps.users.permissions import (
    IsAdmin,
    IsAdminOrOrganizer,
    IsAdminOrOrganizerOrTrainer,
)


# ─────────────────────────────────────────────────────────────────────────────
# VUES CRITÈRES D'ÉVALUATION
# ─────────────────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        summary="Lister les critères d'évaluation",
        description="Liste paginée des critères d'évaluation. Filtrable par `project` (UUID) ou `competency_name`.",
        parameters=[
            OpenApiParameter(
                name="project",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filtrer par UUID du projet.",
            ),
            OpenApiParameter(
                name="competency_name",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filtrer par nom de compétence.",
            ),
        ],
        tags=["Evaluations"],
    ),
    create=extend_schema(summary="Créer un critère d'évaluation", tags=["Evaluations"]),
    retrieve=extend_schema(summary="Détail d'un critère d'évaluation", tags=["Evaluations"]),
    update=extend_schema(summary="Modifier un critère d'évaluation", tags=["Evaluations"]),
    partial_update=extend_schema(summary="Modifier partiellement un critère", tags=["Evaluations"]),
    destroy=extend_schema(summary="Supprimer un critère d'évaluation", tags=["Evaluations"]),
)
class EvaluationCriterionViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des critères d'évaluation par projet."""

    queryset = EvaluationCriterion.objects.select_related("project").all()
    serializer_class = EvaluationCriterionSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdminOrOrganizer()]

    def get_queryset(self):
        queryset = super().get_queryset()
        project_param = self.request.query_params.get("project")
        if project_param:
            try:
                parsed_uuid = UUID(project_param)
            except ValueError:
                raise ValidationError({"project": ["UUID de projet invalide."]})
            queryset = queryset.filter(project_id=parsed_uuid)

        competency = self.request.query_params.get("competency_name")
        if competency:
            queryset = queryset.filter(competency_name__icontains=competency)

        return queryset


# ─────────────────────────────────────────────────────────────────────────────
# VUES ASSIGNATIONS DE PROJET
# ─────────────────────────────────────────────────────────────────────────────

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
            "deliverables__criterion_scores__criterion",
        )
        .all()
    )

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        if self.action == "create":
            return [IsAdminOrOrganizerOrTrainer()]
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

        # Filtrage selon le rôle
        if not (user.is_staff or user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER)):
            if user.role == User.Role.LEARNER:
                queryset = queryset.filter(enrollment__user_id=user.id)
            elif user.role == User.Role.TRAINER:
                assigned_cohort_ids = TrainerAssignment.objects.filter(
                    user=user,
                    status=TrainerAssignment.StatusEnum.ACTIVE,
                ).values_list("cohort_id", flat=True)
                queryset = queryset.filter(enrollment__cohort_id__in=assigned_cohort_ids)
            else:
                return queryset.none()

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


# ─────────────────────────────────────────────────────────────────────────────
# VUES SOUMISSION ET LISTE DES LIVRABLES
# ─────────────────────────────────────────────────────────────────────────────

class DeliverableSubmitView(APIView):
    """POST /api/v1/assignments/<assignment_id>/deliverables/submit/ - Soumettre un livrable (apprenant)."""

    permission_classes = [CanSubmitDeliverable]
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
    """GET /api/v1/assignments/<assignment_id>/deliverables/ - Lister les livrables d'une assignation."""

    serializer_class = DeliverableSerializer
    permission_classes = [CanViewEvaluation]

    def get_queryset(self):
        assignment = get_object_or_404(ProjectAssignment, pk=self.kwargs["assignment_id"])
        return Deliverable.objects.filter(assignment=assignment).select_related(
            "assignment__project",
            "assignment__enrollment__user",
            "assignment__enrollment__cohort",
            "submitted_by",
            "reviewed_by",
        ).prefetch_related("attachments", "criterion_scores__criterion")

    def get(self, request, *args, **kwargs):
        assignment = get_object_or_404(ProjectAssignment, pk=self.kwargs["assignment_id"])
        self.check_object_permissions(request, assignment)
        return super().get(request, *args, **kwargs)


class DeliverableDetailView(generics.RetrieveAPIView):
    """GET /api/v1/deliverables/<pk>/ - Détail d'un livrable."""

    queryset = Deliverable.objects.select_related(
        "assignment__project",
        "assignment__enrollment__user",
        "assignment__enrollment__cohort",
        "submitted_by",
        "reviewed_by",
    ).prefetch_related("attachments", "criterion_scores__criterion")
    serializer_class = DeliverableSerializer
    permission_classes = [CanViewEvaluation]


class DeliverableReviewView(APIView):
    """POST /api/v1/deliverables/<deliverable_id>/review/ - Corriger et noter un livrable (formateur/admin)."""

    permission_classes = [CanGradeEvaluation]
    parser_classes = [JSONParser]

    @extend_schema(
        summary="Corriger et évaluer un livrable",
        description="Permet à un formateur ou administrateur de valider/rejeter un livrable, d'attribuer une note et un feedback ou une grille critériée.",
        request=DeliverableReviewSerializer,
        responses={200: DeliverableSerializer},
        tags=["Evaluations"],
    )
    def post(self, request, deliverable_id):
        deliverable = get_object_or_404(Deliverable, pk=deliverable_id)

        serializer = DeliverableReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status_decision = serializer.validated_data["status"]
        score = serializer.validated_data.get("score")
        feedback = serializer.validated_data.get("feedback", "")
        criterion_scores = serializer.validated_data.get("criterion_scores")

        reviewed = review_deliverable(
            deliverable=deliverable,
            trainer=request.user,
            status_decision=status_decision,
            score=score,
            feedback=feedback,
            criterion_scores_data=criterion_scores,
        )

        output = DeliverableSerializer(reviewed, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS STATISTIQUES & KPIS
# ─────────────────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """GET /api/v1/dashboard/stats/ - Métriques globales d'administration."""

    permission_classes = [IsAdminOrOrganizer]

    @extend_schema(
        summary="Statistiques globales Dashboard",
        description="Fournit l'ensemble des indicateurs clés (utilisateurs, cohortes actives, taux de complétion, taux de validation, distributions) pour le tableau de bord administrateur.",
        responses={200: DashboardStatsSerializer},
        tags=["Dashboard"],
    )
    def get(self, request):
        stats_data = get_dashboard_stats()
        return Response(stats_data, status=status.HTTP_200_OK)


class CohortStatsView(APIView):
    """GET /api/v1/cohorts/<cohort_id>/stats/ - Statistiques & progression d'une cohorte."""

    permission_classes = [CanViewCohortStats]

    @extend_schema(
        summary="Statistiques et progression d'une cohorte",
        description="Fournit la progression moyenne, le taux de validation, les indicateurs par projet et par compétence pour une cohorte donnée.",
        responses={200: CohortStatsSerializer},
        tags=["Cohorts"],
    )
    def get(self, request, cohort_id):
        cohort = get_object_or_404(Cohort.objects.select_related("program"), pk=cohort_id)
        self.check_object_permissions(request, cohort)
        stats_data = get_cohort_stats(cohort)
        return Response(stats_data, status=status.HTTP_200_OK)
