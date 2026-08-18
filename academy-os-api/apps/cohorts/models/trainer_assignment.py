from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel
from apps.users.models import User


class TrainerAssignment(UUIDModel, TimeStampedModel):
    """Affectation : un formateur (mentor) affecté à une cohorte."""

    class StatusEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        SUSPENDED = "suspended", "Suspended"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="trainer_assignments",
    )
    cohort = models.ForeignKey(
        "cohorts.Cohort",
        on_delete=models.CASCADE,
        related_name="trainer_assignments",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.ACTIVE,
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trainer_assignments"
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cohort", "user"],
                name="uniq_trainer_assignment_cohort_user",
            )
        ]

    def clean(self):
        super().clean()
        if self.user_id:
            user = self.user
            if user.role != User.Role.TRAINER:
                raise ValidationError(
                    {"user": "Seul un utilisateur avec le rôle 'trainer' peut être affecté à une cohorte."}
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_id} → {self.cohort_id} ({self.status})"