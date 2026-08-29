import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

from apps.core.models import UUIDModel, SoftDeletableModel

ALLOWED_EXTENSIONS = [
    "pdf", "doc", "docx", "zip", "png", "jpg", "jpeg",
    "txt", "md", "ipynb", "py", "js", "java", "c", "cpp",
]

MAX_UPLOAD_SIZE_MB = 10


def validate_file_size(file):
    if file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f"Le fichier dépasse la taille maximale autorisée ({MAX_UPLOAD_SIZE_MB} Mo)."
        )


def attachment_upload_path(instance, filename):
    """Chemin généré (UUID), pas le nom original : évite la traversée de
    répertoire, les collisions de noms et l'énumération d'URLs."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return f"attachments/{uuid.uuid4()}.{ext}" if ext else f"attachments/{uuid.uuid4()}"


class Attachment(UUIDModel, SoftDeletableModel):
    """Fichier téléversé, rattachable à n'importe quelle entité métier
    (Projet, Livrable, Session, Certificat...) via GenericForeignKey.

    Le lien est posé au moment de la création du parent (upload dans la même
    requête, service `create_attachments`). content_type/object_id sont
    nullables : un upload sans parent reste possible (endpoint standalone).
    """

    file = models.FileField(
        upload_to=attachment_upload_path,
        validators=[FileExtensionValidator(ALLOWED_EXTENSIONS), validate_file_size],
    )
    original_filename = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_attachments",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.UUIDField(null=True, blank=True, db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        db_table = "attachments"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_filename or str(self.file.name)

    def save(self, *args, **kwargs):
        if self.file:
            # Le nom stocké est un UUID ; on garde le nom original, tronqué à
            # 255 caractères (CharField ; Postgres lèverait une DataError sinon).
            self.original_filename = (self.file.name.rsplit("/", 1)[-1])[:255]
        super().save(*args, **kwargs)
