from rest_framework import serializers

from apps.attachments.serializers import AttachmentSerializer

from .models import Project


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
