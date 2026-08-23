from decimal import Decimal
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.attachments.serializers import AttachmentSerializer
from apps.evaluations.models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS CRITÈRES D'ÉVALUATION
# ─────────────────────────────────────────────────────────────────────────────

class EvaluationCriterionSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour un critère d'évaluation."""

    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = EvaluationCriterion
        fields = [
            "id",
            "project",
            "project_title",
            "title",
            "description",
            "competency_name",
            "max_score",
            "weight",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS NOTES PAR CRITÈRE
# ─────────────────────────────────────────────────────────────────────────────

class CriterionScoreSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture pour la note d'un critère sur un livrable."""

    criterion_title = serializers.CharField(source="criterion.title", read_only=True)
    competency_name = serializers.CharField(source="criterion.competency_name", read_only=True)
    max_score = serializers.DecimalField(source="criterion.max_score", max_digits=5, decimal_places=2, read_only=True)
    weight = serializers.DecimalField(source="criterion.weight", max_digits=4, decimal_places=2, read_only=True)

    class Meta:
        model = CriterionScore
        fields = [
            "id",
            "criterion",
            "criterion_title",
            "competency_name",
            "max_score",
            "weight",
            "score",
            "level",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CriterionScoreInputSerializer(serializers.Serializer):
    """Données d'entrée pour noter un critère lors d'une correction."""

    criterion = serializers.UUIDField(help_text="UUID du critère d'évaluation")
    score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, help_text="Note attribuée")
    level = serializers.ChoiceField(
        choices=CriterionScore.LevelEnum.choices,
        default=CriterionScore.LevelEnum.IN_PROGRESS,
        help_text="Niveau d'acquisition de la compétence",
    )
    feedback = serializers.CharField(required=False, allow_blank=True, default="", help_text="Commentaire détaillé")


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS LIVRABLES
# ─────────────────────────────────────────────────────────────────────────────

class DeliverableSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture complet pour un Livrable."""

    submitted_by_email = serializers.EmailField(
        source="submitted_by.email",
        read_only=True,
    )
    reviewed_by_email = serializers.EmailField(
        source="reviewed_by.email",
        read_only=True,
        allow_null=True,
    )
    attachments = AttachmentSerializer(many=True, read_only=True)
    criterion_scores = CriterionScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Deliverable
        fields = [
            "id",
            "assignment",
            "version",
            "submitted_by",
            "submitted_by_email",
            "submitted_at",
            "repo_url",
            "live_url",
            "comments",
            "attachments",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "score",
            "feedback",
            "criterion_scores",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assignment",
            "version",
            "submitted_by",
            "submitted_by_email",
            "submitted_at",
            "attachments",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "score",
            "feedback",
            "criterion_scores",
            "created_at",
            "updated_at",
        ]


class DeliverableSubmitSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour la soumission d'un livrable par l'apprenant."""

    repo_url = serializers.URLField(
        required=False,
        allow_blank=True,
        default="",
        help_text="URL du dépôt distant (GitHub, GitLab...)",
    )
    live_url = serializers.URLField(
        required=False,
        allow_blank=True,
        default="",
        help_text="URL de la démo en ligne ou du déploiement",
    )
    comments = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Commentaires ou explications de l'étudiant",
    )
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=[],
        help_text="Fichiers joints (ZIP, PDF, maquettes...). Envoyer en multipart/form-data.",
    )


class DeliverableReviewSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour l'évaluation / correction par le formateur."""

    status = serializers.ChoiceField(
        choices=[
            (Deliverable.StatusEnum.VALIDATED, "Validé"),
            (Deliverable.StatusEnum.REJECTED, "Rejeté"),
        ],
        help_text="Décision de validation ('validated' ou 'rejected')",
    )
    score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
        help_text="Note globale manuelle (si omise, calculée automatiquement à partir des criterion_scores)",
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Commentaires détaillés du formateur",
    )
    criterion_scores = CriterionScoreInputSerializer(
        many=True,
        required=False,
        help_text="Grille d'évaluation détaillée par compétence",
    )


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS ASSIGNATIONS DE PROJET
# ─────────────────────────────────────────────────────────────────────────────

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture pour une assignation de projet."""

    user_id = serializers.UUIDField(
        source="enrollment.user.id",
        read_only=True,
    )
    user_email = serializers.EmailField(
        source="enrollment.user.email",
        read_only=True,
    )
    user_name = serializers.SerializerMethodField()
    cohort_id = serializers.UUIDField(
        source="enrollment.cohort.id",
        read_only=True,
    )
    cohort_name = serializers.CharField(
        source="enrollment.cohort.name",
        read_only=True,
    )
    project_title = serializers.CharField(
        source="project.title",
        read_only=True,
    )
    project_order = serializers.IntegerField(
        source="project.order",
        read_only=True,
    )
    deliverables = DeliverableSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProjectAssignment
        fields = [
            "id",
            "enrollment",
            "user_id",
            "user_email",
            "user_name",
            "cohort_id",
            "cohort_name",
            "project",
            "project_title",
            "project_order",
            "status",
            "assigned_at",
            "deadline_override",
            "final_score",
            "deliverables",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "enrollment",
            "user_id",
            "user_email",
            "user_name",
            "cohort_id",
            "cohort_name",
            "project",
            "project_title",
            "project_order",
            "status",
            "assigned_at",
            "final_score",
            "deliverables",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        user = obj.enrollment.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.email


class ProjectAssignmentCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur d'assignation manuelle de projet.

    Valide que le projet appartient au même programme que la cohorte
    de l'inscription.
    """

    class Meta:
        model = ProjectAssignment
        fields = [
            "enrollment",
            "project",
            "deadline_override",
        ]

    def validate(self, attrs):
        enrollment = attrs["enrollment"]
        project = attrs["project"]
        if project.program_id != enrollment.cohort.program_id:
            raise serializers.ValidationError(
                {
                    "project": (
                        "Ce projet n'appartient pas au programme de la cohorte "
                        f"de l'inscription (projet : {project.program_id}, "
                        f"cohorte : {enrollment.cohort.program_id})."
                    )
                }
            )
        return attrs


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS STATISTIQUES & KPIS
# ─────────────────────────────────────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    """Schéma OpenAPI pour les statistiques globales du Dashboard Admin."""

    total_users = serializers.IntegerField()
    total_learners = serializers.IntegerField()
    active_learners = serializers.IntegerField()
    pending_learners = serializers.IntegerField()
    total_trainers = serializers.IntegerField()
    total_organizers = serializers.IntegerField()
    total_admins = serializers.IntegerField()

    total_programs = serializers.IntegerField()
    active_programs = serializers.IntegerField()

    total_cohorts = serializers.IntegerField()
    active_cohorts = serializers.IntegerField()
    upcoming_cohorts = serializers.IntegerField()
    completed_cohorts = serializers.IntegerField()

    total_projects = serializers.IntegerField()
    published_projects = serializers.IntegerField()

    total_evaluations = serializers.IntegerField()
    total_validated_evaluations = serializers.IntegerField()
    total_rejected_evaluations = serializers.IntegerField()
    total_pending_evaluations = serializers.IntegerField()

    total_certificates = serializers.IntegerField()
    issued_certificates = serializers.IntegerField()
    pending_certificates = serializers.IntegerField()

    global_completion_rate = serializers.FloatField(help_text="Pourcentage global d'inscriptions terminées")
    global_validation_rate = serializers.FloatField(help_text="Pourcentage de validation des assignations évaluées")
    average_score = serializers.FloatField(help_text="Moyenne générale de toutes les assignations validées")
    learners_per_cohort_avg = serializers.FloatField(help_text="Nombre moyen d'apprenants par cohorte")

    cohorts_by_status = serializers.DictField(child=serializers.IntegerField())
    enrollments_by_status = serializers.DictField(child=serializers.IntegerField())
    evaluations_by_status = serializers.DictField(child=serializers.IntegerField())
    competency_levels_distribution = serializers.DictField(child=serializers.IntegerField())
    recent_evaluations = serializers.ListField(child=serializers.DictField())


class ProjectStatItemSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    title = serializers.CharField()
    order = serializers.IntegerField()
    total_criteria_count = serializers.IntegerField()
    total_learners_count = serializers.IntegerField()
    evaluated_count = serializers.IntegerField()
    validated_count = serializers.IntegerField()
    revision_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    validation_percentage = serializers.FloatField()
    average_score = serializers.FloatField(allow_null=True)


class CompetencyStatItemSerializer(serializers.Serializer):
    competency_name = serializers.CharField()
    average_score = serializers.FloatField(allow_null=True)
    mastered_count = serializers.IntegerField()
    acquired_count = serializers.IntegerField()
    in_progress_count = serializers.IntegerField()
    not_acquired_count = serializers.IntegerField()


class LearnerProgressItemSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    mentor_name = serializers.CharField(allow_null=True)
    validated_projects_count = serializers.IntegerField()
    total_projects_count = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    average_score = serializers.FloatField(allow_null=True)
    status = serializers.CharField()


class CohortStatsSerializer(serializers.Serializer):
    """Schéma OpenAPI pour les statistiques détaillées d'une cohorte."""

    cohort_id = serializers.UUIDField()
    cohort_name = serializers.CharField()
    program_id = serializers.UUIDField()
    program_name = serializers.CharField()
    status = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    total_learners = serializers.IntegerField()
    active_learners = serializers.IntegerField()
    completed_learners = serializers.IntegerField()
    dropped_learners = serializers.IntegerField()
    suspended_learners = serializers.IntegerField()

    total_trainers = serializers.IntegerField()
    assigned_mentors_count = serializers.IntegerField()
    unassigned_mentors_count = serializers.IntegerField()

    total_projects = serializers.IntegerField()
    average_progress = serializers.FloatField(help_text="Progression moyenne des apprenants en %")
    validation_rate = serializers.FloatField(help_text="Taux de validation des évaluations dans la cohorte en %")
    completion_rate = serializers.FloatField(help_text="Taux d'apprenants ayant validé 100% des projets")
    average_score = serializers.FloatField(allow_null=True, help_text="Note moyenne globale de la cohorte")

    projects_stats = ProjectStatItemSerializer(many=True)
    competency_stats = CompetencyStatItemSerializer(many=True)
    learners_progress = LearnerProgressItemSerializer(many=True)
