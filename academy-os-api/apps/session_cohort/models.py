from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel


class Session(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        A_VENIR = "a_venir", "A venir"
        EN_COURS = "en_cours", "En cours"
        TERMINE = "termine", "Terminé"

    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.A_VENIR,
    )

    class Meta:
        db_table = "cohort_sessions"
        ordering = ["-created_at"]
        verbose_name = "Session"
        verbose_name_plural = "Sessions"

    def __str__(self):
        return f"Session {self.start_date} - {self.end_date} ({self.status})"