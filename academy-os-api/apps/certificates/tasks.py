import logging

from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Certificate
from .services import generate_certificate_pdf

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_certificate_pdf_task(self, certificate_id):
    """Tâche Celery asynchrone non-bloquante : génère le PDF du certificat
    et le stocke (local/S3).
    """
    try:
        certificate = Certificate.objects.select_related(
            "inscription__user", "inscription__cohort__program"
        ).get(pk=certificate_id)

        # Si le fichier PDF a déjà été généré et existe sur le stockage, ne pas réécrire
        if certificate.file_path and default_storage.exists(certificate.file_path):
            logger.info("Le PDF du certificat %s existe déjà sur le stockage.", certificate_id)
            return str(certificate.id)

        generate_certificate_pdf(certificate)
        logger.info("PDF du certificat %s généré avec succès en tâche de fond.", certificate.id)
        return str(certificate.id)

    except Certificate.DoesNotExist:
        logger.error("Certificat introuvable pour la génération PDF : %s", certificate_id)
    except Exception as exc:
        logger.error(
            "Erreur lors de la génération PDF du certificat %s : %s. Nouvelle tentative dans %ss...",
            certificate_id, exc, self.default_retry_delay,
        )
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_certificate_email_task(self, certificate_id):
    """Tâche Celery asynchrone : marque le certificat comme envoyé, et
    envoie l'email de félicitations avec le PDF existant en pièce jointe.

    Le PDF est généré une seule et unique fois. Cette tâche ne le
    régénère pas s'il existe déjà sur le stockage.
    """
    try:
        certificate = Certificate.objects.select_related(
            "inscription__user", "inscription__cohort__program"
        ).get(pk=certificate_id)

        # Si le PDF n'a pas encore été généré (cas de secours), le produire une première fois
        if not certificate.file_path or not default_storage.exists(certificate.file_path):
            certificate = generate_certificate_pdf(certificate)

        # Une réclamation active (pending/in_progress) bloque l'envoi : le
        # certificat reste EN_ATTENTE tant qu'elle n'est pas traitée.
        from apps.claims.models import Claim

        if Claim.objects.filter(
            certificate=certificate,
            status__in=[Claim.StatusEnum.PENDING, Claim.StatusEnum.IN_PROGRESS],
        ).exists():
            logger.warning(
                "Envoi du certificat %s bloqué : réclamation en cours.", certificate_id
            )
            return str(certificate.id)

        certificate.date_envoi = timezone.now()
        certificate.status = Certificate.StatusCertificateEnum.SENT
        certificate.save(update_fields=["status", "date_envoi", "updated_at"])

        learner = certificate.inscription.user
        program_title = certificate.inscription.cohort.program.title

        html_content = render_to_string(
            "emails/certificate_ready.html",
            {
                "learner_first_name": learner.first_name,
                "program_title": program_title,
            },
        )

        email = EmailMultiAlternatives(
            subject=f"Félicitations, votre certificat {program_title} est prêt",
            body=f"Félicitations {learner.first_name}, votre certificat pour {program_title} est prêt.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@academy.local"),
            to=[learner.email],
        )
        email.attach_alternative(html_content, "text/html")

        with default_storage.open(certificate.file_path, "rb") as pdf_file:
            email.attach(
                f"certificat-{certificate.id}.pdf",
                pdf_file.read(),
                "application/pdf",
            )

        email.send(fail_silently=False)
        logger.info(
            "Email de certificat envoyé à %s (certificat %s)",
            learner.email, certificate.id,
        )

    except Certificate.DoesNotExist:
        logger.error("Certificat introuvable pour l'envoi d'email : %s", certificate_id)
    except Exception as exc:
        logger.error(
            "Échec de l'envoi de l'email de certificat pour %s : %s. Nouvelle tentative dans %ss...",
            certificate_id, exc, self.default_retry_delay,
        )
        raise self.retry(exc=exc)
