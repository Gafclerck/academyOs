from django.conf import settings
from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel
from apps.session_cohort.models import Cohorte


class Enrollment(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        TERMINEE = "terminee", "Terminée"
        ABANDONNEE = "abandonnee", "Abandonnée"

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    cohort = models.ForeignKey(
        Cohorte,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.ACTIVE,
    )

    class Meta:
        db_table = "enrollments"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["learner", "cohort"],
                name="unique_learner_cohort",
            )
        ]

    def __str__(self):
        return f"{self.learner} - {self.cohort}"
