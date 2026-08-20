from rest_framework import serializers

from apps.attachments.serializers import AttachmentSerializer
from apps.evaluations.models import Deliverable, ProjectAssignment


class DeliverableSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture complet pour un Livrable."""

    submitted_by_email = serializers.EmailField(
        source="submitted_by.email",
        read_only=True,
    )
    reviewed_by_email = serializers.EmailField(
        source="reviewed_by.email",
        read_only=True,
        allow_null=True,
    )
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Deliverable
        fields = [
            "id",
            "assignment",
            "version",
            "submitted_by",
            "submitted_by_email",
            "submitted_at",
            "repo_url",
            "live_url",
            "comments",
            "attachments",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "score",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assignment",
            "version",
            "submitted_by",
            "submitted_by_email",
            "submitted_at",
            "attachments",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "score",
            "feedback",
            "created_at",
            "updated_at",
        ]


class DeliverableSubmitSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour la soumission d'un livrable par l'apprenant."""

    repo_url = serializers.URLField(
        required=False,
        allow_blank=True,
        default="",
        help_text="URL du dépôt distant (GitHub, GitLab...)",
    )
    live_url = serializers.URLField(
        required=False,
        allow_blank=True,
        default="",
        help_text="URL de la démo en ligne ou du déploiement",
    )
    comments = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Commentaires ou explications de l'étudiant",
    )
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=[],
        help_text="Fichiers joints (ZIP, PDF, maquettes...). Envoyer en multipart/form-data.",
    )


class DeliverableReviewSerializer(serializers.Serializer):
    """Sérialiseur d'entrée pour l'évaluation / correction par le formateur."""

    status = serializers.ChoiceField(
        choices=[
            (Deliverable.StatusEnum.VALIDATED, "Validé"),
            (Deliverable.StatusEnum.REJECTED, "Rejeté"),
        ],
        help_text="Décision de validation ('validated' ou 'rejected')",
    )
    score = serializers.IntegerField(
        min_value=0,
        required=True,
        help_text="Note ou points attribués",
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Commentaires détaillés du formateur",
    )


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture pour une assignation de projet."""

    user_id = serializers.UUIDField(
        source="enrollment.user.id",
        read_only=True,
    )
    user_email = serializers.EmailField(
        source="enrollment.user.email",
        read_only=True,
    )
    user_name = serializers.SerializerMethodField()
    cohort_id = serializers.UUIDField(
        source="enrollment.cohort.id",
        read_only=True,
    )
    cohort_name = serializers.CharField(
        source="enrollment.cohort.name",
        read_only=True,
    )
    project_title = serializers.CharField(
        source="project.title",
        read_only=True,
    )
    project_order = serializers.IntegerField(
        source="project.order",
        read_only=True,
    )
    deliverables = DeliverableSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProjectAssignment
        fields = [
            "id",
            "enrollment",
            "user_id",
            "user_email",
            "user_name",
            "cohort_id",
            "cohort_name",
            "project",
            "project_title",
            "project_order",
            "status",
            "assigned_at",
            "deadline_override",
            "final_score",
            "deliverables",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "enrollment",
            "user_id",
            "user_email",
            "user_name",
            "cohort_id",
            "cohort_name",
            "project",
            "project_title",
            "project_order",
            "status",
            "assigned_at",
            "final_score",
            "deliverables",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        user = obj.enrollment.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name or user.email


class ProjectAssignmentCreateSerializer(serializers.ModelSerializer):
    """Serialiseur d'assignation manuelle de projet.

    Valide que le projet appartient au même programme que la cohorte
    de l'inscription.
    """

    class Meta:
        model = ProjectAssignment
        fields = [
            "enrollment",
            "project",
            "deadline_override",
        ]

    def validate(self, attrs):
        enrollment = attrs["enrollment"]
        project = attrs["project"]
        if project.program_id != enrollment.cohort.program_id:
            raise serializers.ValidationError(
                {
                    "project": (
                        "Ce projet n'appartient pas au programme de la cohorte "
                        f"de l'inscription (projet : {project.program_id}, "
                        f"cohorte : {enrollment.cohort.program_id})."
                    )
                }
            )
        return attrs
