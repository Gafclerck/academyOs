from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import Certificate


class CertificateAdminSerializer(serializers.ModelSerializer):
    """Sérialiseur de gestion (admin / organisateur).

    Enrichit le certificat avec les informations de l'apprenant et du
    contexte (programme/cohorte) afin de piloter la file d'attente des
    certificats en attente et leur envoi. Tous les champs sont en lecture
    seule.
    """

    learner_name = serializers.CharField(
        source="inscription.user.full_name",
        read_only=True,
    )
    learner_email = serializers.CharField(
        source="inscription.user.email",
        read_only=True,
    )
    program_title = serializers.CharField(
        source="inscription.cohort.program.title",
        read_only=True,
    )
    cohort_name = serializers.CharField(
        source="inscription.cohort.name",
        read_only=True,
    )
    program_id = serializers.UUIDField(
        source="inscription.cohort.program_id",
        read_only=True,
    )
    cohort_id = serializers.UUIDField(
        source="inscription.cohort_id",
        read_only=True,
    )
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        if not obj.file_path:
            return None
        request = self.context.get("request")
        url = default_storage.url(obj.file_path)
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Certificate
        fields = [
            "id",
            "learner_name",
            "learner_email",
            "program_title",
            "cohort_name",
            "program_id",
            "cohort_id",
            "status",
            "date_generation",
            "date_envoi",
            "file_path",
            "url",
            "sent_by",
        ]
        read_only_fields = fields


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
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        if not obj.file_path:
            return None
        request = self.context.get("request")
        url = default_storage.url(obj.file_path)
        return request.build_absolute_uri(url) if request else url

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
            "url",
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
