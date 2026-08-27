"""Service de génération de certificat, isolé pour rester modifiable
sans casser les vues qui l'appellent.
"""

import logging
from typing import Optional, Tuple

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from apps.evaluations.models import ProjectAssignment
from apps.projects.models import Project
from .models import Certificate

logger = logging.getLogger(__name__)


def is_eligible_for_certificate(enrollment, threshold: Optional[float] = None) -> bool:
    """Vérifie si un apprenant est éligible à la génération de son certificat.

    Un apprenant est éligible dès qu'il a validé au moins `threshold`%
    (par défaut 80%) des projets publiés du programme de sa cohorte.
    """
    if threshold is None:
        threshold = getattr(settings, "CERTIFICATE_ACHIEVEMENT_THRESHOLD", 80.0)

    total_published = Project.objects.filter(
        program=enrollment.cohort.program,
        status=Project.StatusProjectEnum.PUBLISHED,
    ).count()

    if total_published == 0:
        return False

    validated_count = ProjectAssignment.objects.filter(
        enrollment=enrollment,
        status=ProjectAssignment.StatusEnum.VALIDATED,
        project__status=Project.StatusProjectEnum.PUBLISHED,
    ).count()

    progress_percentage = (validated_count / total_published) * 100.0
    return progress_percentage >= float(threshold)


def generate_certificate(enrollment) -> Tuple[Certificate, bool]:
    """Crée (ou récupère) le certificat lié à une inscription (statut PENDING)."""
    certificate, created = Certificate.objects.get_or_create(
        inscription=enrollment,
        defaults={"status": Certificate.StatusCertificateEnum.PENDING},
    )
    return certificate, created


def trigger_certificate_if_eligible(enrollment) -> Optional[Certificate]:
    """Vérifie l'éligibilité (>= 80%) et déclenche la génération asynchrone du PDF.

    Utilise `transaction.on_commit` pour garantir que la tâche Celery
    n'est déposée dans la file qu'après le commit PostgreSQL effectif.
    """
    if not is_eligible_for_certificate(enrollment):
        return None

    certificate, created = generate_certificate(enrollment)

    # Si le certificat est nouvellement créé ou si son PDF n'a pas encore été généré
    if created or not certificate.file_path:
        def _dispatch_pdf_task():
            try:
                from .tasks import generate_certificate_pdf_task
                generate_certificate_pdf_task.delay(str(certificate.id))
            except Exception as exc:
                logger.warning(
                    "Impossible de planifier la tâche Celery generate_certificate_pdf_task pour %s : %s",
                    certificate.id,
                    exc,
                )

        transaction.on_commit(_dispatch_pdf_task)

    return certificate


def _render_pdf_bytes(html_content: str) -> bytes:
    """Rend HTML → PDF via WeasyPrint.

    Fonction isolée pour permettre le mock unitaire sans installer les
    dépendances système (GTK, Pango, Cairo) dans les tests CI/Windows.
    """
    from weasyprint import HTML

    return HTML(string=html_content).write_pdf()


def generate_certificate_pdf(certificate: Certificate) -> Certificate:
    """Génère le fichier PDF d'un certificat à partir du template HTML
    et le sauvegarde via le système de stockage Django (local ou S3
    selon STORAGE_BACKEND). Met à jour certificate.file_path.
    """
    inscription = certificate.inscription
    verification_url = f"{settings.FRONTEND_URL}/certificats/{certificate.id}"
    date_display = certificate.date_generation or timezone.now()
    date_formatted = date_display.strftime("%d/%m/%Y")

    learner_name = (
        f"{inscription.user.first_name} {inscription.user.last_name}".strip()
        or inscription.user.email
    )

    html_content = render_to_string(
        "certificates/certificate.html",
        {
            "learner_name": learner_name,
            "program_title": inscription.cohort.program.title,
            "cohort_name": inscription.cohort.name,
            "date_generation": date_formatted,
            "certificate_id": certificate.id,
            "verification_url": verification_url,
        },
    )

    pdf_bytes = _render_pdf_bytes(html_content)

    file_name = f"certificates/{certificate.id}.pdf"
    if certificate.file_path and default_storage.exists(certificate.file_path):
        try:
            default_storage.delete(certificate.file_path)
        except Exception as exc:
            logger.warning("Impossible de supprimer l'ancien fichier PDF %s: %s", certificate.file_path, exc)

    saved_path = default_storage.save(file_name, ContentFile(pdf_bytes))

    certificate.file_path = saved_path
    certificate.save(update_fields=["file_path"])

    return certificate
