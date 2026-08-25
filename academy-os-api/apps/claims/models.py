from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.models import UUIDModel, TimeStampedModel


class Claim(UUIDModel, TimeStampedModel):
    """Réclamation d'un apprenant concernant son certificat.

    Flux : PENDING → IN_PROGRESS → RESOLVED / REJECTED
    Réouverture : RESOLVED / REJECTED → IN_PROGRESS
    """

    class StatusEnum(models.TextChoices):
        PENDING = "pending", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        RESOLVED = "resolved", "Résolu"
        REJECTED = "rejected", "Rejeté"

    ALLOWED_TRANSITIONS = {
        StatusEnum.PENDING: [StatusEnum.IN_PROGRESS],
        StatusEnum.IN_PROGRESS: [StatusEnum.RESOLVED, StatusEnum.REJECTED],
        StatusEnum.RESOLVED: [StatusEnum.IN_PROGRESS],
        StatusEnum.REJECTED: [StatusEnum.IN_PROGRESS],
    }

    certificate = models.ForeignKey(
        "certificates.Certificate",
        on_delete=models.CASCADE,
        related_name="claims",
    )
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="claims",
    )
    message = models.TextField(
        max_length=2000,
        help_text="Description de la réclamation par l'apprenant.",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusEnum.choices,
        default=StatusEnum.PENDING,
    )
    admin_response = models.TextField(
        max_length=2000,
        blank=True,
        default="",
        help_text="Réponse ou note de traitement par l'admin/l'organisateur.",
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_claims",
    )
    handled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "claims"
        ordering = ["-created_at"]
        verbose_name = "Réclamation"
        verbose_name_plural = "Réclamations"
        constraints = [
            models.UniqueConstraint(
                fields=["certificate"],
                condition=models.Q(status__in=["pending", "in_progress"]),
                name="uniq_active_claim_per_certificate",
            ),
        ]

    def clean(self):
        super().clean()
        if self.status and self.pk:
            old = Claim.objects.get(pk=self.pk)
            allowed = self.ALLOWED_TRANSITIONS.get(old.status, [])
            if self.status not in allowed:
                raise ValidationError(
                    {
                        "status": (
                            f"Transition invalide : {old.status} → {self.status}. "
                            f"Transitions autorisées : {[t for t in allowed]}"
                        )
                    }
                )

    def __str__(self):
        return f"Claim {self.id} ({self.status}) — cert {self.certificate_id}"
