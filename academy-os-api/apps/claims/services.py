"""Services du module claims : création et traitement des réclamations
de certificats par les apprenants."""

import logging

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.certificates.models import Certificate
from apps.notifications.models import Notification
from apps.notifications.services import create_notifications
from apps.users.models import User

from .models import Claim

logger = logging.getLogger(__name__)


def _validate_claim_eligibility(learner, certificate):
    """Vérifie que l'apprenant peut créer une réclamation pour ce certificat."""
    if certificate.inscription is None:
        raise ValidationError(
            {"certificate": "Ce certificat n'est pas associé à une inscription."}
        )

    if certificate.inscription.user_id != learner.id:
        raise PermissionDenied(
            "Vous ne pouvez pas créer une réclamation pour un certificat qui ne vous appartient pas."
        )

    from apps.cohorts.models import Enrollment

    if certificate.inscription.status != Enrollment.StatusEnum.COMPLETED:
        raise ValidationError(
            {
                "certificate": (
                    "Votre inscription n'est pas terminée. "
                    "Vous ne pouvez réclamer un certificat qu'une fois la formation complétée."
                )
            }
        )

    if certificate.status != Certificate.StatusCertificateEnum.PENDING:
        raise ValidationError(
            {
                "certificate": (
                    "Ce certificat a déjà été envoyé. "
                    "Vous ne pouvez pas créer de réclamation pour un certificat déjà remis."
                )
            }
        )


def _notify_admins_created(claim):
    """Envoie (en masse, sans bloquer l'action) une notification à tous les
    admins et organisateurs actifs quand une réclamation est créée."""
    recipients = User.objects.filter(
        role__in=[User.Role.ADMIN, User.Role.ORGANIZER],
        status=User.Status.ACTIVE,
    )
    learner_email = claim.learner.email
    cert_id_short = str(claim.certificate_id)[:8]
    try:
        create_notifications(
            recipients=recipients,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Nouvelle réclamation certificat",
            message=(
                f"L'apprenant {learner_email} a soumis une réclamation "
                f"pour le certificat {cert_id_short}…"
            ),
            content_object=claim,
        )
    except Exception:
        # Best-effort : une notification défaillante ne doit pas annuler
        # la création de la réclamation.
        logger.warning("Échec d'envoi des notifications (réclamation créée)", exc_info=True)


def _notify_learner_status_change(claim):
    """Envoie une notification à l'apprenant quand le statut change
    (best-effort : ne doit pas faire échouer la mise à jour)."""
    status_display = claim.get_status_display()
    try:
        create_notifications(
            recipients=[claim.learner],
            notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            title="Réclamation mise à jour",
            message=(
                f"Le statut de votre réclamation pour le certificat "
                f"{str(claim.certificate_id)[:8]}… a été mis à jour : {status_display}."
            ),
            content_object=claim,
        )
    except Exception:
        logger.warning("Échec d'envoi de la notification (statut réclamation)", exc_info=True)


@transaction.atomic
def create_claim(learner, certificate_id, message):
    """Crée une réclamation de certificat avec toutes les vérifications d'éligibilité.

    - Vérifie la propriété du certificat
    - Vérifie que l'inscription est terminée
    - Vérifie que le certificat n'a pas été envoyé
    - Vérifie qu'aucune réclamation active n'existe
    - Notifie les admins/organisateurs
    """
    try:
        certificate = Certificate.objects.select_related(
            "inscription__user", "inscription__cohort__program"
        ).get(pk=certificate_id)
    except Certificate.DoesNotExist:
        raise ValidationError({"certificate": "Certificat introuvable."})

    _validate_claim_eligibility(learner, certificate)

    if Claim.objects.filter(
        certificate=certificate,
        status__in=[Claim.StatusEnum.PENDING, Claim.StatusEnum.IN_PROGRESS],
    ).exists():
        raise ValidationError(
            {
                "certificate": (
                    "Une réclamation active existe déjà pour ce certificat. "
                    "Vous ne pouvez pas en créer une nouvelle tant qu'elle n'est pas traitée."
                )
            }
        )

    claim = Claim.objects.create(
        certificate=certificate,
        learner=learner,
        message=message.strip(),
    )

    _notify_admins_created(claim)

    return claim


@transaction.atomic
def update_claim_status(claim, new_status, admin_response=None, handled_by=None):
    """Met à jour le statut d'une réclamation avec validation de la transition.

    - Admin/organisateur uniquement (vérifié dans la view)
    - Transition contrôlée selon ALLOWED_TRANSITIONS
    - handled_by et handled_at définis automatiquement
    - Notifie l'apprenant du changement de statut
    """
    allowed = claim.ALLOWED_TRANSITIONS.get(claim.status, [])
    if new_status not in allowed:
        raise ValidationError(
            {
                "status": (
                    f"Transition invalide : {claim.status} → {new_status}. "
                    f"Transitions autorisées : {[t for t in allowed]}"
                )
            }
        )

    claim.status = new_status
    if admin_response is not None:
        claim.admin_response = admin_response.strip()
    claim.handled_by = handled_by
    claim.handled_at = timezone.now()
    claim.save(update_fields=["status", "admin_response", "handled_by", "handled_at", "updated_at"])

    _notify_learner_status_change(claim)

    return claim
