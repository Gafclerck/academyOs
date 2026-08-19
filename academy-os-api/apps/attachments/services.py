"""Services du module Attachment : enregistrement des fichiers dans la même
requête que la création de l'entité parente (Projet, Livrable, Session...).
"""

from django.db import transaction

from .models import Attachment


@transaction.atomic
def create_attachments(user, files, *, parent=None):
    """Valide puis enregistre une liste de fichiers uploadés, rattachés à un parent.

    Deux passes :
    1. Validation de TOUS les fichiers via `full_clean()` (extension + taille).
       Si un seul est invalide, ValidationError est levée avant toute écriture :
       aucun octet ne transite vers le stockage (la transaction ne rollback que
       la base, pas le disque/S3).
    2. Sauvegarde de chacun (écriture disque/S3 + row) ; `transaction.atomic`
       garantit le rollback de la base si une sauvegarde échoue en cours de lot.

    Le lien `parent` est posé via GenericForeignKey (content_type/object_id).
    """
    attachments = []
    for f in files:
        attachment = Attachment(file=f, uploaded_by=user)
        if parent is not None:
            attachment.content_object = parent
        attachment.full_clean()
        attachments.append(attachment)
    for attachment in attachments:
        attachment.save()
    return attachments
