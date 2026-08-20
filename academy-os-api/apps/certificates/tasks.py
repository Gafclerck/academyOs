import logging

from celery import shared_task
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Certificate
from .services import generate_certificate_pdf

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_certificate_email_task(self, certificate_id):
    """Tâche Celery asynchrone : génère le PDF du certificat, le marque
    comme envoyé, et envoie l'email de félicitations avec le PDF en
    pièce jointe.

    Séparée de send_email_async (apps.users.tasks) car celle-ci ne gère
    pas les pièces jointes -- éviter de modifier un fichier partagé par
    toute la squad pour un besoin propre aux certificats.
    """
    try:
        certificate = Certificate.objects.select_related(
            "inscription__user", "inscription__cohort__program"
        ).get(pk=certificate_id)

        certificate = generate_certificate_pdf(certificate)

        certificate.status = Certificate.StatusCertificateEnum.SENT
        certificate.date_envoi = timezone.now()
        certificate.save(update_fields=["status", "date_envoi"])

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
