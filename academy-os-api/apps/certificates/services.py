"""Service de génération de certificat, isolé pour rester modifiable
sans casser les vues qui l'appellent (voir Mémoire de projet v12)."""

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.template.loader import render_to_string
from weasyprint import HTML

from .models import Certificate


def is_eligible_for_certificate(enrollment):
    """Vérifie si un apprenant est éligible à la génération de son certificat.

    Placeholder en attente de la confirmation de la règle exacte avec Malick
    (comptage simple des projets validés vs pondération par points).
    Retourne toujours True pour l'instant : l'admin garde la responsabilité
    de la décision via le déclenchement manuel de /generate/.
    """
    return True


def generate_certificate(enrollment):
    """Crée (ou récupère) le certificat lié à une inscription.

    Ne génère pas encore le fichier PDF ni n'envoie l'email : ces étapes
    seront branchées ici une fois le service PDF et la tâche Celery écrits
    (sous-tâches suivantes).
    """
    certificate, created = Certificate.objects.get_or_create(
        inscription=enrollment,
        defaults={"status": Certificate.StatusCertificateEnum.PENDING},
    )
    return certificate, created


def generate_certificate_pdf(certificate):
    """Génère le fichier PDF d'un certificat à partir du template HTML
    et le sauvegarde via le système de stockage Django (local ou S3
    selon STORAGE_BACKEND). Met à jour certificate.file_path.

    Ne modifie pas le statut du certificat : cette fonction ne fait que
    produire et stocker le fichier, la décision d'envoi reste séparée.
    """
    inscription = certificate.inscription
    verification_url = f"{settings.FRONTEND_URL}/certificats/{certificate.id}"

    html_content = render_to_string(
        "certificates/certificate.html",
        {
            "learner_name": inscription.user.full_name,
            "program_title": inscription.cohort.program.title,
            "cohort_name": inscription.cohort.name,
            "date_envoi": certificate.date_envoi,
            "certificate_id": certificate.id,
            "verification_url": verification_url,
        },
    )

    pdf_bytes = HTML(string=html_content).write_pdf()

    file_name = f"certificates/{certificate.id}.pdf"
    saved_path = default_storage.save(file_name, ContentFile(pdf_bytes))

    certificate.file_path = saved_path
    certificate.save(update_fields=["file_path"])

    return certificate
