from rest_framework import serializers

from apps.users.models import User
from apps.users.serializers import UserSerializer

from .models import Cohort, Enrollment, Intake, TrainerAssignment


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


class MentorSerializer(serializers.ModelSerializer):
    """Affectation (mentor) embarquée dans une inscription."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = TrainerAssignment
        fields = ["id", "user", "status"]


class EnrollmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    mentor = MentorSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "user", "cohort", "status", "enrolled_at", "mentor"]
        read_only_fields = ["id", "cohort", "enrolled_at"]


class TrainerAssignmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TrainerAssignment
        fields = ["id", "user", "cohort", "status", "assigned_at"]
        read_only_fields = ["id", "cohort", "assigned_at"]


class AddEmailsSerializer(serializers.Serializer):
    """Ajout de membres par liste d'emails."""

    emails = serializers.ListField(
        child=serializers.EmailField(),
        allow_empty=False,
    )


class MemberResultItemSerializer(serializers.Serializer):
    email = serializers.EmailField()
    status = serializers.CharField()
    detail = serializers.CharField()


class MemberBatchResultSerializer(serializers.Serializer):
    results = MemberResultItemSerializer(many=True)


class AssignMentorSerializer(serializers.Serializer):
    """Affectation d'un mentor (TrainerAssignment) à une inscription."""

    mentor = serializers.UUIDField(required=True, allow_null=True)