from rest_framework import serializers

from .models import Intake, Cohort


class IntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intake
        fields = [
            "id",
            "name",
            "start_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class CohortSerializer(serializers.ModelSerializer):
    start_date = serializers.DateField(required=False)

    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "description",
            "program",
            "intake",
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

        intake = attrs.get(
            "intake",
            self.instance.intake if self.instance else None,
        )

        if not start_date and intake:
            start_date = intake.start_date
            attrs["start_date"] = start_date

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "The end date must be after the start date."
                    )
                }
            )

        if intake and start_date < intake.start_date:
            raise serializers.ValidationError(
                {
                    "start_date": (
                        "The start date must not be before the intake "
                        f"start date ({intake.start_date})."
                    )
                }
            )

        return attrs