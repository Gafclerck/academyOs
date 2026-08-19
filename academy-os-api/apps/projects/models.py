from django.contrib.contenttypes.fields import GenericRelation
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
        DRAFT = "draft", "Non publié"
        PUBLISHED = "published", "Publié"

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
    # Statut de publication : non publié (brouillon) ou publié.
    status = models.CharField(
        max_length=30,
        choices=StatusProjectEnum.choices,
        default=StatusProjectEnum.DRAFT,
    )
    # Rang du projet dans l'ordre de passage du programme (commence à 1).
    order = models.PositiveIntegerField(default=1)

    # Pièces jointes polymorphiques (énoncés, consignes, ressources) avec suppression en cascade
    attachments = GenericRelation(
        "attachments.Attachment",
        related_query_name="projects",
    )

    class Meta:
        db_table = "projects"
        ordering = ["program", "order", "-created_at"]
        constraints = [
            # Deux projets ne peuvent pas avoir le même rang dans un même programme.
            models.UniqueConstraint(
                fields=["program", "order"],
                name="unique_project_order_per_program",
            )
        ]

    def __str__(self):
        return f"{self.program.title} - {self.title}"
