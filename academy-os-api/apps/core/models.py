import uuid

from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet gérant le soft delete, la restauration et le filtrage des éléments vivants/supprimés."""

    def delete(self):
        """Soft delete en lot : horodate deleted_at au lieu de supprimer de la base."""
        for obj in self:
            if hasattr(obj, "attachments"):
                try:
                    obj.attachments.all().delete()
                except Exception:
                    pass
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        """Suppression SQL physique définitive."""
        return super().delete()

    def restore(self):
        """Restauration en lot : réinitialise deleted_at à None."""
        return self.update(deleted_at=None)

    def alive(self):
        """Filtre les enregistrements actifs (non supprimés)."""
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        """Filtre les enregistrements supprimés logiquement."""
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager par défaut : filtre automatiquement les objets non supprimés (deleted_at IS NULL)."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager global : retourne l'ensemble des objets (actifs et supprimés logiquement)."""

    pass


class DeletedObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager corbeille : retourne uniquement les objets supprimés logiquement."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=False)


class UUIDModel(models.Model):
    """Base abstraite : clé primaire UUID au lieu d'un autoincrement."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """Base abstraite : horodatage automatique de création et de modification."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeletableModel(models.Model):
    """Base abstraite : suppression logique avec horodatage deleted_at et restauration."""

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()
    deleted_objects = DeletedObjectsManager()

    class Meta:
        abstract = True

    @property
    def is_deleted(self) -> bool:
        """Indique si l'objet a été supprimé logiquement."""
        return self.deleted_at is not None

    def delete(self, using=None, keep_parents=False, hard=False):
        """Suppression logique par défaut (ou suppression définitive si hard=True)."""
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)
        self.deleted_at = timezone.now()
        update_fields = ["deleted_at"]
        if hasattr(self, "updated_at"):
            update_fields.append("updated_at")
        self.save(using=using, update_fields=update_fields)

        if hasattr(self, "attachments"):
            try:
                self.attachments.all().delete()
            except Exception:
                pass

    def restore(self, using=None):
        """Restaure un objet supprimé logiquement."""
        self.deleted_at = None
        update_fields = ["deleted_at"]
        if hasattr(self, "updated_at"):
            update_fields.append("updated_at")
        self.save(using=using, update_fields=update_fields)

    def hard_delete(self, using=None, keep_parents=False):
        """Suppression SQL physique définitive de l'instance."""
        return self.delete(using=using, keep_parents=keep_parents, hard=True)

