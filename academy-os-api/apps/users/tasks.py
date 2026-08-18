import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_async(self, subject, message, recipient_list, from_email=None, html_message=None):
    """Tâche Celery asynchrone pour l'envoi d'emails (texte brut & HTML) avec retry automatique."""
    sender = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@academy.local")
    if isinstance(recipient_list, str):
        recipient_list = [recipient_list]
    try:
        logger.info("Envoi d'email asynchrone vers %s (Sujet: %s)", recipient_list, subject)
        return send_mail(
            subject=subject,
            message=message,
            from_email=sender,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        logger.error("Échec de l'envoi d'email vers %s : %s. Nouvelle tentative dans %ss...", recipient_list, exc, self.default_retry_delay)
        raise self.retry(exc=exc)
