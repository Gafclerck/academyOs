from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel
from apps.programs.models import Program


class Project(UUIDModel, TimeStampedModel):
    """Projet rattaché à un programme de formation.

    Représente un travail que les apprenants doivent réaliser.
    Chaque projet possède un ordre de passage unique par programme,
    afin de garantir une progression pédagogique cohérente.
    """

    class StatusProjectEnum(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        EN_COURS_VALIDATION = "en_cours_validation", "En cours de validation"
        VALIDE = "valide", "Validé"
        REJETE = "rejete", "Rejeté"

    # Programme auquel ce projet appartient (obligatoire).
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    # Titre court du projet, affiché dans les listes et le détail.
    title = models.CharField(max_length=255)
    # Description détaillée du projet (consignes, livrables attendus…).
    description = models.TextField(blank=True, default="")
    # Statut du cycle de vie : en attente → en cours de validation → validé ou rejeté.
    status = models.CharField(
        max_length=30,
        choices=StatusProjectEnum.choices,
        default=StatusProjectEnum.EN_ATTENTE,
    )
    # Rang du projet dans l'ordre de passage du programme (commence à 1).
    ordre = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "projects"
        ordering = ["program", "ordre", "-created_at"]
        constraints = [
            # Deux projets ne peuvent pas avoir le même rang dans un même programme.
            models.UniqueConstraint(
                fields=["program", "ordre"],
                name="unique_project_order_per_program",
            )
        ]

    def __str__(self):
        return f"{self.program.title} - {self.title}"
