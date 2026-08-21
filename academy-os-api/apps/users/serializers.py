from django.contrib.auth import password_validation
from django.utils import timezone
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer de LECTURE : ce qui est renvoyé au client ."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role", "status", "phone_number", "created_at"]
        read_only_fields = fields


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer d'administration : CRUD complet des utilisateurs (Admin only)."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "status",
            "phone_number",
            "is_active",
            "is_staff",
            "last_login",
            "password_reset_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_active",
            "last_login",
            "password_reset_at",
            "created_at",
            "updated_at",
        ]


class CreateUserSerializer(serializers.ModelSerializer):
    """Création directe d'un utilisateur par un administrateur (Admin only).

    Permet de créer un compte actif avec son mot de passe et son profil.
    """

    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "role",
            "status",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "is_active", "created_at"]

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user



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
        user.password_reset_at = timezone.now()
        user.save(update_fields=["password", "password_reset_at"])
        return user


class UpdateMeSerializer(serializers.ModelSerializer):
    """Mise à jour du profil : uniquement des champs non sensibles.
    role / email / is_staff / is_superuser sont volontairement absents."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number"]


class InviteSerializer(serializers.Serializer):
    """Invitation d'un formateur ou d'un apprenant par email.

    Deux modes :
    - `email` (unique) : comportement historique, réponse {detail, email}.
    - `emails` (liste) : invitation en lot, réponse {results: [...]}.
    Au moins l'un des deux est requis.
    """

    email = serializers.EmailField(required=False)
    emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=False,
    )
    role = serializers.ChoiceField(
        choices=[User.Role.TRAINER, User.Role.LEARNER],
        default=User.Role.LEARNER,
    )

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("emails"):
            raise serializers.ValidationError(
                {"emails": "Fournissez 'email' ou 'emails' pour l'invitation."}
            )
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """Demande de code de réinitialisation de mot de passe."""

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Définition d'un nouveau mot de passe à partir du code reçu par email (compte ACTIVE)."""

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class ActivateAccountSerializer(serializers.Serializer):
    """Activation d'un compte invité (compte PENDING) : mot de passe + profil complet."""

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, allow_blank=False)
    last_name = serializers.CharField(max_length=150, allow_blank=False)
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    def validate_first_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Le prénom ne peut pas être vide.")
        return val

    def validate_last_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Le nom ne peut pas être vide.")
        return val

    def validate_phone_number(self, value):
        if value:
            import re
            val = value.strip()
            if not re.match(r"^\+?[0-9\s\-()]{7,20}$", val):
                raise serializers.ValidationError("Format de numéro de téléphone invalide.")
            return val
        return None

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value

