import logging

from django.core.files.storage import default_storage
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Certificate

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Certificate)
def delete_certificate_file_on_delete(sender, instance, **kwargs):
    """Supprime physiquement le fichier PDF sur le stockage (S3 / Local)
    lorsqu'un certificat est supprimé de la base de données.
    """
    if instance.file_path and default_storage.exists(instance.file_path):
        try:
            default_storage.delete(instance.file_path)
            logger.info("Fichier PDF du certificat supprimé du stockage : %s", instance.file_path)
        except Exception as exc:
            logger.warning(
                "Impossible de supprimer le fichier physique du certificat %s (%s) : %s",
                instance.id,
                instance.file_path,
                exc,
            )
