from rest_framework import serializers

from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    """Sérialiseur complet, pour l'apprenant consultant ses propres certificats (/me/).

    Tous les champs sont en lecture seule : un apprenant ne peut jamais
    modifier son certificat directement via l'API.
    """

    program_title = serializers.CharField(
        source="inscription.cohort.program.title",
        read_only=True,
    )
    cohort_name = serializers.CharField(
        source="inscription.cohort.name",
        read_only=True,
    )

    class Meta:
        model = Certificate
        fields = [
            "id",
            "program_title",
            "cohort_name",
            "status",
            "date_generation",
            "date_envoi",
            "file_path",
        ]
        read_only_fields = fields


class CertificatePublicSerializer(serializers.ModelSerializer):
    """Sérialiseur de vérification publique (GET /{id}/, sans authentification).

    Expose uniquement le nécessaire pour qu'un tiers (employeur, partenaire)
    vérifie l'authenticité d'un certificat. Aucune donnée sensible
    (email, téléphone, autres inscriptions) n'est incluse volontairement.
    """

    learner_name = serializers.CharField(
        source="inscription.user.full_name",
        read_only=True,
    )
    program_title = serializers.CharField(
        source="inscription.cohort.program.title",
        read_only=True,
    )

    class Meta:
        model = Certificate
        fields = ["id", "learner_name", "program_title", "status", "date_envoi"]
        read_only_fields = fields
