import hashlib
import hmac
import secrets

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetToken, User

RESET_CODE_TTL_MINUTES = getattr(settings, "PASSWORD_RESET_TOKEN_TTL_MINUTES", 30)
INVITE_CODE_TTL_DAYS = getattr(settings, "PASSWORD_RESET_INVITE_TTL_DAYS", 7)
FROM_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", None)


def _hash_code(code):
    """Hash HMAC-SHA256 du code : on ne stocke jamais le code en clair."""
    return hmac.new(settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()


def _generate_code():
    """Code OTP numérique à 6 chiffres."""
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_reset_token(user, expires_in=None):
    """Crée un token à usage unique pour l'utilisateur et renvoie le code en clair."""
    if expires_in is None:
        expires_in = timezone.timedelta(minutes=RESET_CODE_TTL_MINUTES)
    code = _generate_code()
    PasswordResetToken.objects.create(
        user=user,
        token=_hash_code(code),
        expires_at=timezone.now() + expires_in,
    )
    return code


def _send_email(subject, message, email):
    send_mail(subject, message, FROM_EMAIL, [email])


def send_reset_password_email(email, code):
    _send_email(
        "Réinitialisation de votre mot de passe",
        f"Votre code de réinitialisation est : {code}\n"
        f"Il expire dans {RESET_CODE_TTL_MINUTES} minutes et n'est utilisable qu'une seule fois.",
        email,
    )


def send_invitation_email(email, code):
    _send_email(
        "Invitation à rejoindre la plateforme",
        f"Vous avez été invité(e) à rejoindre la plateforme.\n"
        f"Utilisez ce code pour définir votre mot de passe : {code}\n"
        f"Il expire dans {INVITE_CODE_TTL_DAYS} jours.",
        email,
    )


def send_account_created_email(email, code):
    _send_email(
        "Votre compte a été créé",
        f"Un compte a été créé pour vous sur la plateforme.\n"
        f"Utilisez ce code pour définir votre mot de passe : {code}\n"
        f"Il expire dans {INVITE_CODE_TTL_DAYS} jours.",
        email,
    )


def create_user_by_admin(email, role, first_name="", last_name="", phone_number=None):
    """Crée un compte à la demande d'un admin, avec le rôle choisi.

    Le compte n'a pas de mot de passe utilisable : un code est envoyé par email
    pour définir le premier mot de passe via le flow reset-password.
    Lève serializers.ValidationError si l'email est déjà utilisé.
    """
    from rest_framework import serializers

    if User.objects.filter(email=email).exists():
        raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe déjà."})
    user = User.objects.create_user(
        email=email,
        password=None,
        role=role,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
    )
    code = generate_reset_token(user, expires_in=timezone.timedelta(days=INVITE_CODE_TTL_DAYS))
    send_account_created_email(user.email, code)
    return user


def invite_user(email, role):
    """Crée (ou réutilise) un utilisateur par email et lui envoie une invitation.

    Le nouveau compte n'a pas de mot de passe utilisable : le code envoyé sert à
    définir le premier mot de passe via le flow reset-password. Retourne (user, created).
    """
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "role": role,
            "first_name": "",
            "last_name": "",
            "phone_number": None,
        },
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
    code = generate_reset_token(user, expires_in=timezone.timedelta(days=INVITE_CODE_TTL_DAYS))
    send_invitation_email(user.email, code)
    return user, created


def reset_password(email, code, new_password):
    """Valide le code et définit le nouveau mot de passe (usage unique, expiration).

    Lève serializers.ValidationError si le code est inconnu, expiré ou déjà utilisé.
    """
    from rest_framework import serializers

    user = User.objects.filter(email=email).first()
    if not user:
        raise serializers.ValidationError({"code": "Code invalide ou expiré."})
    token = PasswordResetToken.objects.filter(user=user, token=_hash_code(code), used=False).first()
    if not token or token.is_expired:
        raise serializers.ValidationError({"code": "Code invalide ou expiré."})
    user.set_password(new_password)
    user.password_reset_at = timezone.now()
    user.save(update_fields=["password", "password_reset_at"])
    token.used = True
    token.save(update_fields=["used"])
    return user