from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.attachments.serializers import AttachmentSerializer

from .models import Project


@extend_schema_field({
    "type": "array",
    "items": {"type": "string", "format": "binary"},
})
class AttachmentFileListField(serializers.ListField):
    """Liste de fichiers uploadables (multipart). Affiche un picker dans Swagger."""

    child = serializers.FileField()


class ProjectSerializer(serializers.ModelSerializer):
    """Sérialiseur du modèle Project.

    Expose l'ensemble des champs en lecture, y compris le titre du programme
    parent (program_title) résolu automatiquement via la relation ForeignKey
    et la liste des pièces jointes associées (attachments).

    En écriture, seul l'id du programme est requis ; le titre en lecture seule
    évite au client de faire un lookup imbriqué.
    """

    # Titre du programme parent, résolu en lecture seule (source="program.title").
    program_title = serializers.CharField(
        source="program.title",
        read_only=True,
    )
    # Pièces jointes rattachées au projet (énoncé, ressources...)
    attachments = AttachmentSerializer(
        many=True,
        read_only=True,
    )
    # Fichiers à joindre au projet lors de la création (multipart/form-data).
    # write_only : n'apparaît que dans les requêtes POST, pas dans les réponses.
    files = AttachmentFileListField(
        write_only=True,
        required=False,
        label="Fichiers",
        help_text="Fichiers à joindre au projet (PDF, DOCX, ZIP…). Optionnel.",
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "program",
            "program_title",
            "title",
            "description",
            "status",
            "order",
            "files",
            "attachments",
            "created_at",
            "updated_at",
        ]
        # Champs en lecture seule : non modifiables par le client.
        read_only_fields = [
            "id",
            "program_title",
            "attachments",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        validated_data.pop("files", None)
        return super().create(validated_data)
