from django.db import models
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeletableModel


class Program(UUIDModel, TimeStampedModel, SoftDeletableModel):
    class StatusProgramEnum(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=StatusProgramEnum.choices,
        default=StatusProgramEnum.ACTIVE,
    )

    class Meta:
        db_table = "programs"
        ordering = ["-created_at"]
        verbose_name = "Programme"
        verbose_name_plural = "Programmes"
        constraints = [
            models.UniqueConstraint(
                fields=["title"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_active_program_title",
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"