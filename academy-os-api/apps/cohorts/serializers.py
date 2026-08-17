from rest_framework import serializers

from .models import TrainingPeriod, Cohort


class TrainingPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingPeriod
        fields = [
            "id",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            self.instance.start_date if self.instance else None,
        )
        end_date = attrs.get(
            "end_date",
            self.instance.end_date if self.instance else None,
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {"end_date": "The end date must be after the start date."}
            )

        return attrs


class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "training_period",
            "start_date",
            "end_date",
            "member_count",
            "project_count",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            self.instance.start_date if self.instance else None,
        )
        end_date = attrs.get(
            "end_date",
            self.instance.end_date if self.instance else None,
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "The end date must be after the start date."
                    )
                }
            )

        return attrs