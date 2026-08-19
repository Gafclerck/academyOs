from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    """Sérialiseur du modèle Project.

    Expose l'ensemble des champs en lecture, y compris le titre du programme
    parent (program_title) résolu automatiquement via la relation ForeignKey.

    En écriture, seul l'id du programme est requis ; le titre en lecture seule
    évite au client de faire un lookup imbriqué.
    """

    # Titre du programme parent, résolu en lecture seule (source="program.title").
    # Permet d'afficher le nom du programme sans requête supplémentaire côté client.
    program_title = serializers.CharField(
        source="program.title",
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
            "ordre",
            "created_at",
            "updated_at",
        ]
        # Champs en lecture seule : non modifiables par le client.
        read_only_fields = [
            "id",
            "program_title",
            "created_at",
            "updated_at",
        ]
