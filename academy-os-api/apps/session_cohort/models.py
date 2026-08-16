from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel


class Session(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        A_VENIR = "a_venir", "A venir"
        EN_COURS = "en_cours", "En cours"
        TERMINE = "termine", "Termine"

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


class Cohorte(UUIDModel, TimeStampedModel):
    class StatusEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        TERMINEE = "terminee", "Terminee"

    nom = models.CharField(max_length=255)
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="cohortes",
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    nb_membres = models.PositiveIntegerField(default=0)
    nb_projets = models.PositiveIntegerField(default=0)
    statut = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.ACTIVE,
    )

    class Meta:
        db_table = "cohortes"
        ordering = ["-created_at"]
        verbose_name = "Cohorte"
        verbose_name_plural = "Cohortes"

    def __str__(self):
        return f"{self.nom} ({self.statut})"
