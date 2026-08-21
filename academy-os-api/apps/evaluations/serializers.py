from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.cohorts.models import Cohort, Enrollment, TrainerAssignment
from apps.projects.models import Project
from apps.users.models import User

from .models import CriterionScore, Evaluation, EvaluationCriterion


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
    """Sérialiseur de lecture pour la note d'un critère."""

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
    """Données d'entrée pour noter un critère lors d'une évaluation."""

    criterion = serializers.UUIDField(help_text="UUID du critère d'évaluation")
    score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, help_text="Note attribuée")
    level = serializers.ChoiceField(
        choices=CriterionScore.LevelEnum.choices,
        default=CriterionScore.LevelEnum.IN_PROGRESS,
        help_text="Niveau d'acquisition de la compétence",
    )
    feedback = serializers.CharField(required=False, allow_blank=True, default="", help_text="Commentaire")


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZERS ÉVALUATIONS
# ─────────────────────────────────────────────────────────────────────────────

class EvaluationListSerializer(serializers.ModelSerializer):
    """Sérialiseur synthétique pour la liste des évaluations."""

    learner_id = serializers.UUIDField(source="enrollment.user.id", read_only=True)
    learner_name = serializers.CharField(source="enrollment.user.full_name", read_only=True)
    learner_email = serializers.EmailField(source="enrollment.user.email", read_only=True)
    cohort_id = serializers.UUIDField(source="enrollment.cohort.id", read_only=True)
    cohort_name = serializers.CharField(source="enrollment.cohort.name", read_only=True)
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    evaluated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "enrollment",
            "learner_id",
            "learner_name",
            "learner_email",
            "cohort_id",
            "cohort_name",
            "project_id",
            "project_title",
            "status",
            "score",
            "evaluated_by",
            "evaluated_by_name",
            "evaluated_at",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            return obj.evaluated_by.full_name or obj.evaluated_by.email
        return None


class EvaluationDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé d'une évaluation avec l'ensemble des notes par critère."""

    learner_id = serializers.UUIDField(source="enrollment.user.id", read_only=True)
    learner_name = serializers.CharField(source="enrollment.user.full_name", read_only=True)
    learner_email = serializers.EmailField(source="enrollment.user.email", read_only=True)
    cohort_id = serializers.UUIDField(source="enrollment.cohort.id", read_only=True)
    cohort_name = serializers.CharField(source="enrollment.cohort.name", read_only=True)
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    evaluated_by_name = serializers.SerializerMethodField()
    criterion_scores = CriterionScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "enrollment",
            "learner_id",
            "learner_name",
            "learner_email",
            "cohort_id",
            "cohort_name",
            "project_id",
            "project_title",
            "status",
            "score",
            "general_feedback",
            "evaluated_by",
            "evaluated_by_name",
            "evaluated_at",
            "criterion_scores",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            return obj.evaluated_by.full_name or obj.evaluated_by.email
        return None


class GradeLearnerInputSerializer(serializers.Serializer):
    """Payload pour enregistrer ou mettre à jour la notation d'un apprenant."""

    enrollment = serializers.UUIDField(help_text="UUID de l'inscription (Enrollment)")
    project = serializers.UUIDField(help_text="UUID du projet à évaluer")
    status = serializers.ChoiceField(
        choices=Evaluation.StatusEnum.choices,
        default=Evaluation.StatusEnum.VALIDATED,
        help_text="Statut de l'évaluation (ex: validated, revision_required, rejected)",
    )
    score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
        help_text="Note globale manuelle (si omise, calculée automatiquement via les critères)",
    )
    general_feedback = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Appréciation globale du formateur/mentor",
    )
    criterion_scores = CriterionScoreInputSerializer(
        many=True,
        required=False,
        help_text="Liste des notes détaillées par critère/compétence",
    )


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

    global_completion_rate = serializers.FloatField(help_text="Pourcentage global d'inscriptions terminées ou projets validés")
    global_validation_rate = serializers.FloatField(help_text="Pourcentage de validation des évaluations soumises")
    average_score = serializers.FloatField(help_text="Moyenne générale de toutes les évaluations")
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
