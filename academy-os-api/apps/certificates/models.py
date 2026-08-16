from django.conf import settings
from django.db import models

from apps.core.models import UUIDModel, TimeStampedModel


class Certificate(UUIDModel, TimeStampedModel):
    class StatusCertificateEnum(models.TextChoices):
        PENDING = "EN_ATTENTE", "En attente"
        SENT = "ENVOYE", "Envoye"

    date_generation = models.DateTimeField(auto_now_add=True)
    date_envoi = models.DateTimeField(null=True, blank=True)
    file_path = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=StatusCertificateEnum.choices,
        default=StatusCertificateEnum.PENDING,
    )
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
