from rest_framework import serializers
from .models import Program


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProgramCohortSummarySerializer(serializers.Serializer):
    cohort_id = serializers.UUIDField()
    cohort_name = serializers.CharField()
    status = serializers.CharField()
    start_date = serializers.DateField(allow_null=True)
    end_date = serializers.DateField(allow_null=True)
    total_learners = serializers.IntegerField()
    average_progress = serializers.FloatField()


class ProgramProjectStatSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    title = serializers.CharField()
    order = serializers.IntegerField()
    status = serializers.CharField()
    total_assigned = serializers.IntegerField()
    validated_count = serializers.IntegerField()
    validation_rate = serializers.FloatField()


class ProgramStatsSerializer(serializers.Serializer):
    """Schéma OpenAPI pour les statistiques consolidées d'un programme."""

    program_id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    status = serializers.CharField()

    total_cohorts = serializers.IntegerField()
    upcoming_cohorts = serializers.IntegerField()
    active_cohorts = serializers.IntegerField()
    completed_cohorts = serializers.IntegerField()

    total_projects = serializers.IntegerField()
    published_projects = serializers.IntegerField()

    total_learners = serializers.IntegerField()
    active_learners = serializers.IntegerField()
    completed_learners = serializers.IntegerField()
    dropped_learners = serializers.IntegerField()

    completion_rate = serializers.FloatField()
    validation_rate = serializers.FloatField()
    average_score = serializers.FloatField(allow_null=True)

    cohorts_summary = ProgramCohortSummarySerializer(many=True)
    projects_stats = ProgramProjectStatSerializer(many=True)
