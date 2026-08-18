from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel
from apps.programs.models import Program


# Modèle représentant un projet rattaché à un programme.
# Chaque projet a un ordre de passage par programme, garantie unique par une contrainte DB.
class Project(UUIDModel, TimeStampedModel):
    class StatusProjectEnum(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        EN_COURS_VALIDATION = "en_cours_validation", "En cours de validation"
        VALIDE = "valide", "Validé"
        REJETE = "rejete", "Rejeté"

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=30,
        choices=StatusProjectEnum.choices,
        default=StatusProjectEnum.EN_ATTENTE,
    )
    ordre = models.PositiveIntegerField(default=1)

    # L'ordre est unique par programme : deux projets ne peuvent pas avoir le même rang
    # dans un même programme. La contrainte empêche les doublons au niveau de la base.
    class Meta:
        db_table = "projects"
        ordering = ["program", "ordre", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["program", "ordre"],
                name="unique_project_order_per_program",
            )
        ]

    def __str__(self):
        return f"{self.program.title} - {self.title}"
