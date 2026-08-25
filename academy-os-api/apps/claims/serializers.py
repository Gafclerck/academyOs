from rest_framework import serializers

from .models import Claim


class ClaimCreateSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour la création d'une réclamation."""

    certificate = serializers.UUIDField(help_text="UUID du certificat concerné")
    message = serializers.CharField(
        max_length=2000,
        help_text="Description de la réclamation",
    )


class ClaimDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture complet pour une réclamation."""

    learner_email = serializers.EmailField(source="learner.email", read_only=True)
    learner_name = serializers.SerializerMethodField()
    certificate_id_display = serializers.SerializerMethodField()
    program_title = serializers.CharField(
        source="certificate.inscription.cohort.program.title",
        read_only=True,
    )
    cohort_name = serializers.CharField(
        source="certificate.inscription.cohort.name",
        read_only=True,
    )
    handled_by_email = serializers.EmailField(
        source="handled_by.email",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Claim
        fields = [
            "id",
            "certificate",
            "certificate_id_display",
            "learner",
            "learner_email",
            "learner_name",
            "program_title",
            "cohort_name",
            "message",
            "status",
            "admin_response",
            "handled_by",
            "handled_by_email",
            "handled_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "certificate",
            "certificate_id_display",
            "learner",
            "learner_email",
            "learner_name",
            "program_title",
            "cohort_name",
            "handled_by",
            "handled_by_email",
            "handled_at",
            "created_at",
            "updated_at",
        ]

    def get_learner_name(self, obj):
        user = obj.learner
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.email

    def get_certificate_id_display(self, obj):
        return str(obj.certificate_id)[:8] + "…"


class ClaimUpdateSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour la mise à jour d'une réclamation (admin/org)."""

    status = serializers.ChoiceField(
        choices=Claim.StatusEnum.choices,
        help_text="Nouveau statut de la réclamation",
    )
    admin_response = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
        default="",
        help_text="Réponse ou note de traitement",
    )
