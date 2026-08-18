from rest_framework import serializers

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    learner_name = serializers.CharField(source="learner.full_name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.nom", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "learner",
            "learner_name",
            "cohort",
            "cohort_name",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "learner_name",
            "cohort_name",
            "created_at",
            "updated_at",
        ]

    def validate_learner(self, value):
        if value.role != "learner":
            raise serializers.ValidationError(
                "Seuls les utilisateurs ayant le rôle learner peuvent être inscrits."
            )
        return value
