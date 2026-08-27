"""Génère un certificat sample (PDF) pour vérification visuelle du rendu.

Utilisation (dans Docker) :
    python manage.py generate_sample_certificate
    python manage.py generate_sample_certificate --output media/certificates/mon_certificat.pdf

Le certificat utilise des données fictives (nom, programme, cohorte) si aucun
enrollment n'existe en base. Le PDF généré est ouvrable dans un navigateur.
"""

import os

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.certificates.models import Certificate
from apps.certificates.services import generate_certificate_pdf
from apps.cohorts.models import Enrollment
from apps.cohorts.tests.factories import EnrollmentFactory
from apps.programs.tests.factories import ProgramFactory


class Command(BaseCommand):
    help = "Génère un certificat sample (PDF) pour vérification visuelle du rendu."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="media/certificates/sample.pdf",
            help="Chemin de sortie du PDF (défaut : media/certificates/sample.pdf)",
        )

    def handle(self, *args, **options):
        output_path = options["output"]

        # Chercher un enrollment existant ou en créer un sample.
        enrollment = Enrollment.objects.select_related(
            "user", "cohort__program"
        ).first()

        if enrollment is None:
            self.stdout.write(
                self.style.WARNING(
                    "Aucune inscription en base. Création de données sample..."
                )
            )
            program = ProgramFactory(title="Programme Xarala — Développement Web Full Stack")
            enrollment = EnrollmentFactory(
                status=Enrollment.StatusEnum.COMPLETED,
                cohort__name="Promo Dakar 2026",
                cohort__program=program,
            )
            enrollment.user.first_name = "Awa"
            enrollment.user.last_name = "Diop"
            enrollment.user.save(update_fields=["first_name", "last_name"])

        certificate, created = Certificate.objects.get_or_create(
            inscription=enrollment,
            defaults={"status": Certificate.StatusCertificateEnum.SENT},
        )

        if created:
            certificate.date_envoi = timezone.now()
            certificate.save(update_fields=["date_envoi"])

        certificate = generate_certificate_pdf(certificate)

        # Copier le fichier généré vers le chemin demandé.
        if certificate.file_path:
            with default_storage.open(certificate.file_path, "rb") as src:
                pdf_bytes = src.read()
            saved = default_storage.save(output_path, ContentFile(pdf_bytes))
            self.stdout.write(
                self.style.SUCCESS(
                    f"PDF généré avec succès !\n"
                    f"  Inscription : {enrollment.user.full_name} — {enrollment.cohort.program.title}\n"
                    f"  Cohorte     : {enrollment.cohort.name}\n"
                    f"  Certificat  : {certificate.id}\n"
                    f"  Sortie      : {saved}\n"
                    f"  Taille      : {len(pdf_bytes):,} octets\n"
                    f"\n"
                    f"Pour visualiser (Docker) :\n"
                    f"  docker compose exec backend python manage.py generate_sample_certificate\n"
                    f"  # Puis ouvrez media/certificates/sample.pdf dans un navigateur."
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR("Échec de la génération du PDF : file_path vide.")
            )
