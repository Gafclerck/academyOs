from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel
from apps.users.models import User
from .trainer_assignment import TrainerAssignment


class Enrollment(UUIDModel, TimeStampedModel):
    """Inscription : un apprenant inscrit à une cohorte, avec un mentor
    (formateur affecté à la MÊME cohorte) optionnel."""

    class StatusEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        DROPPED = "dropped", "Dropped"
        SUSPENDED = "suspended", "Suspended"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    cohort = models.ForeignKey(
        "cohorts.Cohort",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.ACTIVE,
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    mentor = models.ForeignKey(
        "cohorts.TrainerAssignment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentees",
    )

    class Meta:
        db_table = "enrollments"
        ordering = ["-enrolled_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cohort", "user"],
                name="uniq_enrollment_cohort_user",
            )
        ]

    def clean(self):
        super().clean()
        if self.user_id:
            user = self.user
            if user.role != User.Role.LEARNER:
                raise ValidationError(
                    {"user": "Seul un utilisateur avec le rôle 'learner' peut être inscrit à une cohorte."}
                )
        if self.mentor_id:
            if self.mentor.cohort_id != self.cohort_id:
                raise ValidationError(
                    {"mentor": "Le mentor doit appartenir à la même cohorte que l'apprenant."}
                )
            if self.mentor.status != TrainerAssignment.StatusEnum.ACTIVE:
                raise ValidationError(
                    {"mentor": "Le formateur doit avoir une affectation active pour être mentor."}
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_id} → {self.cohort_id} ({self.status})"

    @property
    def display_name(self):
        user = self.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.email