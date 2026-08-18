from rest_framework import serializers

from .models import Project


# Sérialiseur pour le modèle Project.
# Expose program_title en lecture seule pour éviter un lookup imbriqué côté client.
class ProjectSerializer(serializers.ModelSerializer):
    # Le titre du programme parent est renvoyé automatiquement en lecture,
    # mais l'id du programme est requis en écriture pour rattacher le projet.
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
        read_only_fields = [
            "id",
            "program_title",
            "created_at",
            "updated_at",
        ]
