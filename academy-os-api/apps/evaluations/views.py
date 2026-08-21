from uuid import UUID

from django.db import models
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cohorts.models import Cohort, TrainerAssignment
from apps.projects.models import Project
from apps.users.models import User
from apps.users.permissions import IsAdmin, IsAdminOrOrganizer

from .models import CriterionScore, Evaluation, EvaluationCriterion
from .permissions import CanGradeEvaluation, CanViewEvaluation
from .serializers import (
    CohortStatsSerializer,
    CriterionScoreSerializer,
    DashboardStatsSerializer,
    EvaluationCriterionSerializer,
    EvaluationDetailSerializer,
    EvaluationListSerializer,
    GradeLearnerInputSerializer,
)
from .services import get_cohort_stats, get_dashboard_stats, grade_learner


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
# VUES ÉVALUATIONS & NOTATIONS
# ─────────────────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        summary="Lister les évaluations",
        description="Liste des évaluations. Filtrable par `cohort`, `project`, `enrollment`, `learner`, `status`.",
        parameters=[
            OpenApiParameter(name="cohort", type=str, location=OpenApiParameter.QUERY, description="UUID de la cohorte"),
            OpenApiParameter(name="project", type=str, location=OpenApiParameter.QUERY, description="UUID du projet"),
            OpenApiParameter(name="enrollment", type=str, location=OpenApiParameter.QUERY, description="UUID de l'inscription"),
            OpenApiParameter(name="learner", type=str, location=OpenApiParameter.QUERY, description="UUID de l'apprenant"),
            OpenApiParameter(name="status", type=str, location=OpenApiParameter.QUERY, description="Statut de l'évaluation"),
        ],
        tags=["Evaluations"],
    ),
    retrieve=extend_schema(
        summary="Détail d'une évaluation avec notes par compétence",
        responses={200: EvaluationDetailSerializer},
        tags=["Evaluations"],
    ),
    destroy=extend_schema(
        summary="Supprimer une évaluation",
        tags=["Evaluations"],
    ),
)
class EvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet de consultation et gestion des évaluations."""

    queryset = (
        Evaluation.objects.select_related(
            "enrollment__user",
            "enrollment__cohort",
            "project",
            "evaluated_by",
        )
        .prefetch_related("criterion_scores__criterion")
        .all()
    )
    http_method_names = ["get", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EvaluationDetailSerializer
        return EvaluationListSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        return [CanViewEvaluation()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Filtrage de sécurité selon le rôle
        if not (user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER)):
            if user.role == User.Role.TRAINER:
                assigned_cohort_ids = TrainerAssignment.objects.filter(
                    user=user,
                    status=TrainerAssignment.StatusEnum.ACTIVE,
                ).values_list("cohort_id", flat=True)
                queryset = queryset.filter(enrollment__cohort_id__in=assigned_cohort_ids)
            elif user.role == User.Role.LEARNER:
                queryset = queryset.filter(enrollment__user=user)
            else:
                return queryset.none()

        # Filtres URL optionnels
        cohort_param = self.request.query_params.get("cohort")
        if cohort_param:
            try:
                queryset = queryset.filter(enrollment__cohort_id=UUID(cohort_param))
            except ValueError:
                raise ValidationError({"cohort": ["UUID invalide."]})

        project_param = self.request.query_params.get("project")
        if project_param:
            try:
                queryset = queryset.filter(project_id=UUID(project_param))
            except ValueError:
                raise ValidationError({"project": ["UUID invalide."]})

        enrollment_param = self.request.query_params.get("enrollment")
        if enrollment_param:
            try:
                queryset = queryset.filter(enrollment_id=UUID(enrollment_param))
            except ValueError:
                raise ValidationError({"enrollment": ["UUID invalide."]})

        learner_param = self.request.query_params.get("learner")
        if learner_param:
            try:
                queryset = queryset.filter(enrollment__user_id=UUID(learner_param))
            except ValueError:
                raise ValidationError({"learner": ["UUID invalide."]})

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset


class GradeLearnerView(APIView):
    """Endpoint de notation pour les formateurs et mentors."""

    permission_classes = [CanGradeEvaluation]

    @extend_schema(
        summary="Noter / Évaluer un apprenant sur un projet",
        description="Permet à un formateur, mentor ou admin d'enregistrer la grille d'évaluation et les notes par compétence d'un apprenant.",
        request=GradeLearnerInputSerializer,
        responses={
            201: EvaluationDetailSerializer,
        },
        tags=["Evaluations"],
    )
    def post(self, request):
        serializer = GradeLearnerInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        evaluation = grade_learner(request.user, serializer.validated_data)
        output_serializer = EvaluationDetailSerializer(evaluation, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


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

    @extend_schema(
        summary="Statistiques et progression d'une cohorte",
        description="Fournit la progression moyenne, le taux de validation, les indicateurs par projet et par compétence pour une cohorte donnée.",
        responses={200: CohortStatsSerializer},
        tags=["Cohorts"],
    )
    def get(self, request, cohort_id):
        cohort = get_object_or_404(Cohort.objects.select_related("program"), pk=cohort_id)

        # Vérification des droits d'accès
        user = request.user
        if not (user and user.is_authenticated):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        if not (user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER)):
            if user.role == User.Role.TRAINER:
                is_assigned = TrainerAssignment.objects.filter(
                    cohort=cohort,
                    user=user,
                    status=TrainerAssignment.StatusEnum.ACTIVE,
                ).exists()
                if not is_assigned:
                    raise PermissionDenied("Vous n'êtes pas affecté à cette cohorte.")
            else:
                raise PermissionDenied("Accès réservé aux administrateurs et formateurs de la cohorte.")

        stats_data = get_cohort_stats(cohort)
        return Response(stats_data, status=status.HTTP_200_OK)
