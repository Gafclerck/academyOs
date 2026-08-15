from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE : ce qui est renvoyé au client ."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role", "phone_number", "created_at"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Création d'un utilisateur par un admin (inscription privée).

    Réservé à l'admin, qui choisit le rôle. Le mot de passe n'est jamais
    fourni ici : l'utilisateur le définit via le code reçu par email (reset-password).
    L'unicité de l'email est validée automatiquement (400 si déjà existant).
    """

    class Meta:
        model = User
        fields = ["email", "role", "first_name", "last_name", "phone_number"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value

    def validate_new_password(self, value):
        password_validation.validate_password(value, user=self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class UpdateMeSerializer(serializers.ModelSerializer):
    """Mise à jour du profil : uniquement des champs non sensibles.
    role / email / is_staff / is_superuser sont volontairement absents."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number"]


class InviteSerializer(serializers.Serializer):
    """Invitation d'un formateur ou d'un apprenant par email."""

    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[User.Role.TRAINER, User.Role.LEARNER],
        default=User.Role.LEARNER,
    )


class ForgotPasswordSerializer(serializers.Serializer):
    """Demande de code de réinitialisation de mot de passe."""

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Définition d'un nouveau mot de passe à partir du code reçu par email."""

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value
