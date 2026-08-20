from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel, UUIDModel


class ProjectAssignment(UUIDModel, TimeStampedModel):
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
    final_score = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "project_assignments"
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "project"],
                name="unique_assignment_per_enrollment_and_project",
            )
        ]

    def __str__(self):
        return f"{self.enrollment.user.email} - {self.project.title} ({self.status})"


class Deliverable(UUIDModel, TimeStampedModel):
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
    score = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, default="")

    class Meta:
        db_table = "deliverables"
        ordering = ["assignment", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "version"],
                name="unique_deliverable_version_per_assignment",
            )
        ]

    def __str__(self):
        return f"Livrable V{self.version} - {self.assignment.project.title} ({self.status})"
