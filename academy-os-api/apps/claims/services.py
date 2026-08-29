"""Services du module claims : création et traitement des réclamations
de certificats par les apprenants."""

import logging

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

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


def _notify_learner_created(claim):
    """Confirme au learner la bonne réception de sa réclamation (best-effort)."""
    try:
        create_notifications(
            recipients=[claim.learner],
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Réclamation soumise",
            message=(
                "Votre réclamation concernant votre certificat "
                f"{str(claim.certificate_id)[:8]}… a bien été enregistrée. "
                "Un administrateur va la traiter."
            ),
            content_object=claim,
        )
    except Exception:
        logger.warning("Échec d'envoi de la notification (réclamation créée, learner)", exc_info=True)


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


def _notify_admins_status_change(claim):
    """Informe les admins/organisateurs actifs d'un changement de statut (best-effort)."""
    recipients = User.objects.filter(
        role__in=[User.Role.ADMIN, User.Role.ORGANIZER],
        status=User.Status.ACTIVE,
    ).exclude(pk=claim.handled_by_id)
    try:
        create_notifications(
            recipients=recipients,
            notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            title="Réclamation traitée",
            message=(
                f"La réclamation de {claim.learner.email} pour le certificat "
                f"{str(claim.certificate_id)[:8]}… est maintenant : {claim.get_status_display()}."
            ),
            content_object=claim,
        )
    except Exception:
        logger.warning("Échec d'envoi des notifications (réclamation traitée)", exc_info=True)


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

    try:
        claim = Claim.objects.create(
            certificate=certificate,
            learner=learner,
            message=message.strip(),
        )
    except IntegrityError:
        # Course : deux créations concurrentes sur le même certificat — la
        # contrainte unique uq_active_claim_per_certificate a arbitré.
        raise ValidationError(
            {
                "certificate": (
                    "Une réclamation active existe déjà pour ce certificat. "
                    "Vous ne pouvez pas en créer une nouvelle tant qu'elle n'est pas traitée."
                )
            }
        )

    _notify_admins_created(claim)
    _notify_learner_created(claim)

    return claim


@transaction.atomic
def update_claim_status(claim, new_status, admin_response=None, handled_by=None):
    """Met à jour une réclamation (statut et/ou réponse admin).

    - Admin/organisateur uniquement (vérifié dans la view)
    - Transition contrôlée selon ALLOWED_TRANSITIONS, uniquement si le statut change
    - Le certificat est verrouillé (select_for_update) pour éviter les doubles
      traitements concurrents
    - handled_by et handled_at renseignés uniquement si le statut change
    - Le learner est notifié uniquement si le statut change ; les admins/orgs
      sont notifiés du nouveau statut (sauf l'acteur)
    """
    # Recharge avec verrou ligne pour éviter les résolutions concurrentes.
    claim = Claim.objects.select_for_update().get(pk=claim.pk)

    status_changed = new_status != claim.status
    if status_changed:
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

    update_fields = []
    if status_changed:
        claim.status = new_status
        claim.handled_by = handled_by
        claim.handled_at = timezone.now()
        update_fields += ["status", "handled_by", "handled_at"]
    if admin_response is not None:
        claim.admin_response = admin_response.strip()
        update_fields.append("admin_response")
    if not update_fields:
        # Rien de nouveau : on n'écrit pas et on ne notifie pas.
        return claim

    update_fields.append("updated_at")
    claim.save(update_fields=update_fields)

    if status_changed:
        _notify_learner_status_change(claim)
        _notify_admins_status_change(claim)

    return claim
