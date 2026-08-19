from django.conf import settings
from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel


class Certificate(UUIDModel, TimeStampedModel):
    """Certificat de complétion délivré à un apprenant à la fin d'une formation.

    Généré automatiquement une fois la formation terminée, il passe par le
    statut « En attente » puis « Envoyé » lorsqu'un administrateur le met
    à disposition de l'apprenant.
    """

    class StatusCertificateEnum(models.TextChoices):
        PENDING = "EN_ATTENTE", "En attente"
        SENT = "ENVOYE", "Envoye"

    # Inscription (enrollment) à laquelle ce certificat est rattaché.
    # Null tant qu'aucune inscription n'est liée (création transitoire).
    inscription = models.OneToOneField(
        "cohorts.Enrollment",
        on_delete=models.CASCADE,
        related_name="certificate",
        null=True,
        blank=True,
    )
    # Date de génération du certificat (remplie automatiquement à la création).
    date_generation = models.DateTimeField(auto_now_add=True)
    # Date à laquelle le certificat a été envoyé à l'apprenant (null = pas encore envoyé).
    date_envoi = models.DateTimeField(null=True, blank=True)
    # Chemin vers le fichier PDF/image du certificat généré.
    file_path = models.CharField(max_length=500, blank=True, default="")
    # Statut du cycle de vie : en attente puis envoyé.
    status = models.CharField(
        max_length=20,
        choices=StatusCertificateEnum.choices,
        default=StatusCertificateEnum.PENDING,
    )
    # Administrateur ayant envoyé le certificat (null = pas encore envoyé).
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_certificates",
    )

    class Meta:
        db_table = "certificates"
        ordering = ["-created_at"]
        verbose_name = "Certificat"
        verbose_name_plural = "Certificats"

    def __str__(self):
        return f"Certificat {self.id} ({self.status})"
