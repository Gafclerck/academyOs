from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel, SoftDeletableModel
from .intake import Intake


class Cohort(UUIDModel, TimeStampedModel, SoftDeletableModel):
    class StatusEnum(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.PROTECT,
        related_name="cohorts",
    )
    intake = models.ForeignKey(
        Intake,
        on_delete=models.CASCADE,
        related_name="cohorts",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.UPCOMING,
    )

    class Meta:
        db_table = "cohorts"
        ordering = ["-created_at"]
        verbose_name = "Cohort"
        verbose_name_plural = "Cohorts"

    def save(self, *args, **kwargs):
        if not self.start_date and self.intake_id:
            self.start_date = self.intake.start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"
