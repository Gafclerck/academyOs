import hashlib
import hmac
import secrets

from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.core import mail
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import PasswordResetToken, User
from .tasks import send_email_async

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
    """Crée un token à usage unique pour l'utilisateur et révoque les précédents."""
    if expires_in is None:
        expires_in = timezone.timedelta(minutes=RESET_CODE_TTL_MINUTES)
    # Révoque les anciens tokens non encore utilisés pour cet utilisateur (anti-bloat)
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    code = _generate_code()
    PasswordResetToken.objects.create(
        user=user,
        token=_hash_code(code),
        expires_at=timezone.now() + expires_in,
    )
    return code


def get_frontend_url(setting_name: str, default_path: str = "") -> str:
    """Construit une URL absolue vers le frontend en combinant FRONTEND_URL et le chemin configuré."""
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    path = getattr(settings, setting_name, default_path).strip()
    if path:
        return f"{base_url}/{path.lstrip('/')}"
    return base_url


def _render_and_send_email(template_name, context, subject, email, connection=None, plain_text=None):
    """Rend un template HTML d'email et l'envoie de manière asynchrone (ou synchrone en test/batch)."""
    base_frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    logo_url = get_frontend_url("FRONTEND_LOGO_PATH", "/logo-xarala.png")
    full_context = {
        "subject": subject,
        "frontend_url": base_frontend_url,
        "current_year": timezone.now().year,
        "logo_url": logo_url,
        **context,
    }
    html_content = render_to_string(template_name, full_context)
    if plain_text is None:
        plain_text = strip_tags(html_content).strip()

    if connection is not None:
        send_mail(
            subject,
            plain_text,
            FROM_EMAIL,
            [email],
            html_message=html_content,
            connection=connection,
        )
    else:
        send_email_async.delay(
            subject,
            plain_text,
            [email],
            from_email=FROM_EMAIL,
            html_message=html_content,
        )


def send_reset_password_email(email, code, connection=None):
    reset_url = get_frontend_url("FRONTEND_RESET_PASSWORD_PATH", "/reset-password")
    plain_text = (
        f"Bonjour,\n\n"
        f"Vous avez demandé la réinitialisation de votre mot de passe sur Xarala Academy.\n"
        f"Votre code de sécurité est : {code}\n"
        f"Il expire dans {RESET_CODE_TTL_MINUTES} minutes et n'est utilisable qu'une seule fois.\n\n"
        f"Lien : {reset_url}"
    )
    _render_and_send_email(
        template_name="emails/reset_password.html",
        context={
            "code": code,
            "expires_in_minutes": RESET_CODE_TTL_MINUTES,
            "reset_url": reset_url,
        },
        subject="Réinitialisation de votre mot de passe",
        email=email,
        connection=connection,
        plain_text=plain_text,
    )


def send_invitation_email(email, code, connection=None, role=None):
    activate_url = get_frontend_url("FRONTEND_ACTIVATE_ACCOUNT_PATH", "/invite-reset-password")
    role_label = "Formateur" if role == User.Role.TRAINER else "Organisateur" if role == User.Role.ORGANIZER else "Apprenant"
    plain_text = (
        f"Bonjour,\n\n"
        f"Vous avez été invité(e) en tant que {role_label} sur la plateforme Xarala Academy.\n"
        f"Votre code d'activation est : {code}\n"
        f"Il expire dans {INVITE_CODE_TTL_DAYS} jours.\n\n"
        f"Lien : {activate_url}"
    )
    _render_and_send_email(
        template_name="emails/invitation.html",
        context={
            "code": code,
            "role": role,
            "expires_in_days": INVITE_CODE_TTL_DAYS,
            "activate_url": activate_url,
        },
        subject="Invitation à rejoindre la plateforme Xarala",
        email=email,
        connection=connection,
        plain_text=plain_text,
    )


def send_account_created_email(email, code, connection=None):
    activate_url = get_frontend_url("FRONTEND_ACTIVATE_ACCOUNT_PATH", "/invite-reset-password")
    plain_text = (
        f"Bonjour,\n\n"
        f"Un compte a été créé pour vous sur Xarala Academy.\n"
        f"Votre code d'activation est : {code}\n"
        f"Il expire dans {INVITE_CODE_TTL_DAYS} jours.\n\n"
        f"Lien : {activate_url}"
    )
    _render_and_send_email(
        template_name="emails/account_created.html",
        context={
            "code": code,
            "expires_in_days": INVITE_CODE_TTL_DAYS,
            "activate_url": activate_url,
        },
        subject="Votre compte a été créé sur Xarala Academy",
        email=email,
        connection=connection,
        plain_text=plain_text,
    )


def send_added_to_cohort_email(email, cohort_name, connection=None, role=None):
    cohort_url = get_frontend_url("FRONTEND_COHORTS_PATH", "/programmes")
    if role == User.Role.TRAINER:
        plain_text = f"Bonjour,\n\nVous avez été affecté(e) en tant que formateur à la cohorte : {cohort_name}.\n\nLien : {cohort_url}"
    else:
        plain_text = f"Bonjour,\n\nVous avez été inscrit(e) à la cohorte : {cohort_name}.\n\nLien : {cohort_url}"
    _render_and_send_email(
        template_name="emails/added_to_cohort.html",
        context={
            "cohort_name": cohort_name,
            "role": role,
            "cohort_url": cohort_url,
        },
        subject=f"Vous avez été ajouté(e) à la cohorte {cohort_name}",
        email=email,
        connection=connection,
        plain_text=plain_text,
    )


def invite_user(email, role, connection=None):
    """Crée (ou réutilise) un utilisateur par email et lui envoie une invitation.

    Le nouveau compte a le statut 'pending' (is_active=False) et n'a pas de mot
    de passe utilisable : le code envoyé sert à définir le mot de passe et
    compléter le profil via le flow activate (/auth/activate/), qui active le
    compte (status='active').
    Retourne (user, created).
    """
    email = BaseUserManager.normalize_email(email).strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    if user:
        from rest_framework import serializers

        if user.status in (User.Status.SUSPENDED, User.Status.ARCHIVED):
            raise serializers.ValidationError({"email": "Ce compte est désactivé. Contactez l'administrateur."})
        code = generate_reset_token(user, expires_in=timezone.timedelta(days=INVITE_CODE_TTL_DAYS))
        send_invitation_email(user.email, code, connection=connection)
        return user, False

    user = User.objects.create_user(
        email=email,
        password=None,
        role=role,
        status=User.Status.PENDING,
        first_name="",
        last_name="",
        phone_number=None,
    )
    user.set_unusable_password()
    user.status = User.Status.PENDING
    user.is_active = False
    user.save(update_fields=["password", "status", "is_active"])
    code = generate_reset_token(user, expires_in=timezone.timedelta(days=INVITE_CODE_TTL_DAYS))
    send_invitation_email(user.email, code, connection=connection)
    return user, True


def invite_users(emails, role):
    """Invite un lot d'emails avec un résultat par email.

    - Une seule connexion SMTP est réutilisée pour tout le lot (efficace).
    - Chaque envoi est isolé : un échec SMTP n'abandonne ni la création des
      autres comptes ni les envois suivants.
      - Retourne une liste de dicts {email, status: created|reused, detail}.
    """
    connection = mail.get_connection()
    results = []
    try:
        for raw_email in emails:
            email = BaseUserManager.normalize_email(raw_email).strip().lower()
            try:
                user, created = invite_user(email, role, connection=connection)
                results.append(
                    {
                        "email": email,
                        "status": "created" if created else "reused",
                        "detail": "Invitation envoyée." if created else "Compte existant, invitation renvoyée.",
                    }
                )
            except Exception:
                results.append(
                    {
                        "email": email,
                        "status": "error",
                        "detail": "Échec de l'invitation (envoi de l'email).",
                    }
                )
    finally:
        connection.close()
    return results


def _validate_and_consume_token(email, code, allowed_status=None):
    """Valide l'utilisateur, son statut et le code OTP, puis révoque les tokens.

    Lève serializers.ValidationError si le code est invalide, expiré ou si
    le statut du compte ne correspond pas à `allowed_status`.
    """
    from rest_framework import serializers

    email = BaseUserManager.normalize_email(email).strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        raise serializers.ValidationError({"code": "Code invalide ou expiré."})

    # Protection contre les comptes désactivés
    if user.status in (User.Status.SUSPENDED, User.Status.ARCHIVED):
        raise serializers.ValidationError({"code": "Ce compte est désactivé. Contactez l'administrateur."})

    if allowed_status is not None:
        if allowed_status == User.Status.PENDING and user.status != User.Status.PENDING:
            if user.status == User.Status.ACTIVE:
                raise serializers.ValidationError(
                    {"code": "Ce compte est déjà activé. Veuillez vous connecter ou réinitialiser votre mot de passe."}
                )
            raise serializers.ValidationError({"code": "Ce compte n'est pas en attente d'activation."})
        elif allowed_status == User.Status.ACTIVE and user.status != User.Status.ACTIVE:
            if user.status == User.Status.PENDING:
                raise serializers.ValidationError(
                    {"code": "Ce compte n'est pas encore activé. Veuillez utiliser l'activation de compte."}
                )
            raise serializers.ValidationError({"code": "Ce compte n'est pas actif."})

    token = PasswordResetToken.objects.filter(user=user, token=_hash_code(code), used=False).first()
    if not token or token.is_expired:
        raise serializers.ValidationError({"code": "Code invalide ou expiré."})

    # Révoque tous les tokens de l'utilisateur
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    return user


def reset_password(email, code, new_password):
    """Valide le code et définit le nouveau mot de passe pour un compte ACTIVE.

    Lève serializers.ValidationError si le code est invalide, expiré ou si le
    compte n'est pas actif.
    """
    user = _validate_and_consume_token(email, code, allowed_status=User.Status.ACTIVE)
    user.set_password(new_password)
    user.password_reset_at = timezone.now()
    user.save(update_fields=["password", "password_reset_at"])
    return user


def activate_user(email, code, new_password, first_name, last_name, phone_number=None):
    """Valide le code d'invitation, enregistre le profil et active le compte PENDING.

    Lève serializers.ValidationError si le code est invalide, expiré ou si le
    compte n'est pas en attente d'activation.
    """
    user = _validate_and_consume_token(email, code, allowed_status=User.Status.PENDING)
    user.set_password(new_password)
    user.password_reset_at = timezone.now()
    user.first_name = first_name.strip()
    user.last_name = last_name.strip()
    user.phone_number = phone_number.strip() if phone_number else None
    user.status = User.Status.ACTIVE
    user.is_active = True
    user.save(update_fields=["password", "password_reset_at", "first_name", "last_name", "phone_number", "status", "is_active"])
    return user