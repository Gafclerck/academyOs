from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel


class TrainingPeriod(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"

    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.UPCOMING,
    )

    class Meta:
        db_table = "training_periods"
        ordering = ["-created_at"]
        verbose_name = "Training period"
        verbose_name_plural = "Training periods"

    def __str__(self):
        return f"Training period {self.start_date} - {self.end_date} ({self.status})"


class Cohort(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"

    name = models.CharField(max_length=255)
    training_period = models.ForeignKey(
        TrainingPeriod,
        on_delete=models.CASCADE,
        related_name="cohorts",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    member_count = models.PositiveIntegerField(default=0)
    project_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.ACTIVE,
    )

    class Meta:
        db_table = "cohorts"
        ordering = ["-created_at"]
        verbose_name = "Cohort"
        verbose_name_plural = "Cohorts"

    def __str__(self):
        return f"{self.name} ({self.status})"