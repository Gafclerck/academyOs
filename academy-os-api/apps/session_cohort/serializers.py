from rest_framework import serializers

from .models import Session, Cohorte


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
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
                {"end_date": "La date de fin doit être postérieure à la date de début."}
            )

        return attrs


class CohorteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohorte
        fields = [
            "id",
            "nom",
            "session",
            "date_debut",
            "date_fin",
            "nb_membres",
            "nb_projets",
            "statut",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        date_debut = attrs.get(
            "date_debut",
            self.instance.date_debut if self.instance else None,
        )
        date_fin = attrs.get(
            "date_fin",
            self.instance.date_fin if self.instance else None,
        )

        if date_debut and date_fin and date_fin <= date_debut:
            raise serializers.ValidationError(
                {
                    "date_fin": (
                        "La date de fin doit être postérieure "
                        "à la date de début."
                    )
                }
            )

        return attrs