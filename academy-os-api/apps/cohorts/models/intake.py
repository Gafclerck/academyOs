from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel, SoftDeletableModel


class Intake(UUIDModel, TimeStampedModel, SoftDeletableModel):
    class StatusEnum(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"

    name = models.CharField(max_length=255)
    start_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.UPCOMING,
    )

    class Meta:
        db_table = "intakes"
        ordering = ["-created_at"]
        verbose_name = "Intake"
        verbose_name_plural = "Intakes"

    def __str__(self):
        return f"{self.name} ({self.status})"