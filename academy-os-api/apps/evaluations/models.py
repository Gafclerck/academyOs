from decimal import Decimal

from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from decimal import Decimal

from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel, UUIDModel, SoftDeletableModel


class EvaluationCriterion(UUIDModel, TimeStampedModel, SoftDeletableModel):
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
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_criterion_order_per_project",
            ),
        ]
        verbose_name = "Critère d'évaluation"
        verbose_name_plural = "Critères d'évaluation"

    def __str__(self):
        return f"{self.project.title} - {self.title} (max: {self.max_score})"


class ProjectAssignment(UUIDModel, TimeStampedModel, SoftDeletableModel):
    """Assignation d'un projet du programme à un apprenant inscrit dans une cohorte."""

    class StatusEnum(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        SUBMITTED = "submitted", "Soumis"
        VALIDATED = "validated", "Validé"

    enrollment = models.ForeignKey(
        "cohorts.Enrollment",
        on_delete=models.CASCADE,
        related_name="project_assignments",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.PROTECT,
        related_name="assignments",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.PENDING,
    )
    assigned_at = models.DateTimeField(default=timezone.now)
    deadline_override = models.DateTimeField(null=True, blank=True)
    final_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Note finale obtenue sur l'assignation de projet",
    )

    class Meta:
        db_table = "project_assignments"
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_assignment_per_enrollment_and_project",
            )
        ]
        verbose_name = "Assignation de projet"
        verbose_name_plural = "Assignations de projet"

    def __str__(self):
        return f"{self.enrollment.user.email} - {self.project.title} ({self.status})"


class Deliverable(UUIDModel, TimeStampedModel, SoftDeletableModel):
    """Livrable soumis par un apprenant pour une assignation de projet (gère les versions/itérations)."""

    class StatusEnum(models.TextChoices):
        SUBMITTED = "submitted", "Soumis"
        VALIDATED = "validated", "Validé"
        REJECTED = "rejected", "Rejeté"

    assignment = models.ForeignKey(
        ProjectAssignment,
        on_delete=models.CASCADE,
        related_name="deliverables",
    )
    version = models.PositiveIntegerField(default=1)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_deliverables",
    )
    submitted_at = models.DateTimeField(default=timezone.now)
    repo_url = models.URLField(max_length=500, blank=True, default="")
    live_url = models.URLField(max_length=500, blank=True, default="")
    comments = models.TextField(blank=True, default="")

    # Pièces jointes polymorphiques (ZIP, PDF, maquettes...) avec suppression en cascade
    attachments = GenericRelation(
        "attachments.Attachment",
        related_query_name="deliverables",
    )

    # Champs d'évaluation / correction par le formateur
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.SUBMITTED,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_deliverables",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Note attribuée pour cette version de livrable",
    )
    feedback = models.TextField(blank=True, default="")

    class Meta:
        db_table = "deliverables"
        ordering = ["assignment", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "version"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_deliverable_version_per_assignment",
            )
        ]
        verbose_name = "Livrable"
        verbose_name_plural = "Livrables"

    def __str__(self):
        return f"Livrable V{self.version} - {self.assignment.project.title} ({self.status})"

    def calculate_score(self):
        """Recalcule la note globale pondérée à partir des scores détaillés par critère."""
        scores = list(self.criterion_scores.select_related("criterion").all())
        if not scores:
            return None

        total_weight = sum(s.criterion.weight for s in scores)
        if total_weight == 0:
            return Decimal("0.00")

        # Normalisation par rapport au max_score du critère ramené sur base 20 (ou moyenne pondérée directe si max_score=20)
        total_weighted_score = sum(
            ((s.score / s.criterion.max_score * Decimal("20.00")) if s.criterion.max_score > 0 else s.score)
            * s.criterion.weight
            for s in scores
        )
        calculated = total_weighted_score / total_weight
        return round(Decimal(str(calculated)), 2)


class CriterionScore(UUIDModel, TimeStampedModel, SoftDeletableModel):
    """Note et appréciation pour un critère spécifique dans une évaluation de livrable."""

    class LevelEnum(models.TextChoices):
        NOT_ACQUIRED = "not_acquired", "Non acquis"
        IN_PROGRESS = "in_progress", "En cours d'acquisition"
        ACQUIRED = "acquired", "Acquis"
        MASTERED = "mastered", "Maîtrisé"

    deliverable = models.ForeignKey(
        Deliverable,
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
                fields=["deliverable", "criterion"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_score_per_deliverable_criterion",
            )
        ]
        verbose_name = "Note par critère"
        verbose_name_plural = "Notes par critère"

    def __str__(self):
        return f"{self.criterion.title} : {self.score} ({self.level})"

