from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class EvaluationCriterion(UUIDModel, TimeStampedModel):
    """Critère d'évaluation ou compétence associée à un projet.

    Définit les éléments sur lesquels un apprenant est noté lors
    de la soutenance ou correction d'un projet.
    """

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="evaluation_criteria",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    competency_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Nom du domaine de compétence (ex: Architecture, Backend, Frontend, DevOps)",
    )
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=20.00,
        validators=[MinValueValidator(0)],
        help_text="Note maximale possible pour ce critère",
    )
    weight = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0)],
        help_text="Coefficient de pondération du critère dans le calcul global",
    )
    order = models.PositiveIntegerField(
        default=1,
        help_text="Ordre d'affichage du critère dans la grille d'évaluation",
    )

    class Meta:
        db_table = "evaluation_criteria"
        ordering = ["project", "order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "order"],
                name="uniq_criterion_order_per_project",
            ),
        ]
        verbose_name = "Critère d'évaluation"
        verbose_name_plural = "Critères d'évaluation"

    def __str__(self):
        return f"{self.project.title} - {self.title} (max: {self.max_score})"


class Evaluation(UUIDModel, TimeStampedModel):
    """Évaluation globale d'un apprenant sur un projet au sein de sa cohorte.

    Effectuée par un formateur ou un mentor affecté à la cohorte.
    """

    class StatusEnum(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_REVIEW = "in_review", "En cours de revue"
        VALIDATED = "validated", "Validé"
        REVISION_REQUIRED = "revision_required", "Révision requise"
        REJECTED = "rejected", "Rejeté"

    enrollment = models.ForeignKey(
        "cohorts.Enrollment",
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conducted_evaluations",
    )
    status = models.CharField(
        max_length=25,
        choices=StatusEnum.choices,
        default=StatusEnum.PENDING,
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Score global calculé ou attribué (sur 20 ou base équivalente)",
    )
    general_feedback = models.TextField(
        blank=True,
        default="",
        help_text="Commentaire général et appréciation du formateur/mentor",
    )
    evaluated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "evaluations"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "project"],
                name="uniq_evaluation_per_enrollment_project",
            )
        ]
        verbose_name = "Évaluation"
        verbose_name_plural = "Évaluations"

    def __str__(self):
        return f"Évaluation {self.project.title} - {self.enrollment.user.email} ({self.status})"

    def calculate_score(self):
        """Recalcule la note globale pondérée à partir des scores détaillés."""
        scores = self.criterion_scores.select_related("criterion").all()
        if not scores:
            return None

        total_weighted_score = sum(s.score * s.criterion.weight for s in scores)
        total_weight = sum(s.criterion.weight for s in scores)

        if total_weight == 0:
            return 0.0

        return round(float(total_weighted_score / total_weight), 2)


class CriterionScore(UUIDModel, TimeStampedModel):
    """Note et appréciation pour un critère spécifique dans une évaluation."""

    class LevelEnum(models.TextChoices):
        NOT_ACQUIRED = "not_acquired", "Non acquis"
        IN_PROGRESS = "in_progress", "En cours d'acquisition"
        ACQUIRED = "acquired", "Acquis"
        MASTERED = "mastered", "Maîtrisé"

    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="criterion_scores",
    )
    criterion = models.ForeignKey(
        EvaluationCriterion,
        on_delete=models.CASCADE,
        related_name="scores",
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Note attribuée pour ce critère",
    )
    level = models.CharField(
        max_length=20,
        choices=LevelEnum.choices,
        default=LevelEnum.IN_PROGRESS,
    )
    feedback = models.TextField(
        blank=True,
        default="",
        help_text="Feedback détaillé pour cette compétence / ce critère",
    )

    class Meta:
        db_table = "criterion_scores"
        ordering = ["criterion__order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "criterion"],
                name="uniq_score_per_evaluation_criterion",
            )
        ]
        verbose_name = "Note par critère"
        verbose_name_plural = "Notes par critère"

    def __str__(self):
        return f"{self.criterion.title} : {self.score} ({self.level})"
