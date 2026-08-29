import factory
from unittest.mock import patch
from django.test import TestCase

from apps.certificates.models import Certificate
from apps.cohorts.tests.factories import EnrollmentFactory
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User

CERTIFICATES_URL = "/api/v1/certificates/"

# Bytes factices > 1000 pour satisfaire les assertions de taille sur le PDF mocké.
FAKE_PDF_BYTES = b"%PDF-1.4\n" + b"x" * 1100


class CertificateFactory(factory.django.DjangoModelFactory):
    """Factory de test pour Certificate, avec une inscription liée par défaut."""

    class Meta:
        model = Certificate

    inscription = factory.SubFactory(EnrollmentFactory)
    status = Certificate.StatusCertificateEnum.PENDING


class CertificateModelTests(TestCase):
    def setUp(self):
        super().setUp()

    # Vérifie qu'un certificat est créé avec les valeurs par défaut attendues.
    def test_certificate_is_created_with_default_values(self):
        certificate = Certificate.objects.create()

        self.assertIsNotNone(certificate.id)
        self.assertEqual(
            certificate.status,
            Certificate.StatusCertificateEnum.PENDING,
        )
        self.assertIsNotNone(certificate.date_generation)
        self.assertIsNone(certificate.date_envoi)
        self.assertEqual(certificate.file_path, "")
        self.assertIsNone(certificate.sent_by)

    # Vérifie qu'un administrateur peut marquer un certificat comme envoyé.
    def test_certificate_can_be_sent_by_an_admin(self):
        admin = User.objects.create_user(
            email="admin@example.com",
            password="test-password",
            role=User.Role.ADMIN,
        )

        certificate = Certificate.objects.create(
            status=Certificate.StatusCertificateEnum.SENT,
            sent_by=admin,
        )

        self.assertEqual(
            certificate.status,
            Certificate.StatusCertificateEnum.SENT,
        )
        self.assertEqual(certificate.sent_by, admin)

    # Vérifie que chaque certificat possède un UUID unique.
    def test_certificate_has_a_unique_uuid(self):
        certificate_1 = Certificate.objects.create()
        certificate_2 = Certificate.objects.create()

        self.assertNotEqual(certificate_1.id, certificate_2.id)


class CertificateMeEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint GET /certificates/me/."""

    # Vérifie qu'un apprenant authentifié peut lister ses propres certificats.
    def test_learner_can_list_own_certificates(self):
        certificate = CertificateFactory(status=Certificate.StatusCertificateEnum.SENT)
        learner = certificate.inscription.user
        response = self.auth(learner).get(f"{CERTIFICATES_URL}me/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(certificate.id)

    # Vérifie qu'un apprenant ne voit pas les certificats d'un autre apprenant.
    def test_learner_does_not_see_other_users_certificates(self):
        CertificateFactory(status=Certificate.StatusCertificateEnum.SENT)
        other_learner = UserFactory()
        response = self.auth(other_learner).get(f"{CERTIFICATES_URL}me/")
        assert response.status_code == 200
        assert len(response.data) == 0

    # Vérifie qu'un utilisateur non authentifié ne peut pas accéder à /me/.
    def test_unauthenticated_user_cannot_access_me(self):
        response = self.client.get(f"{CERTIFICATES_URL}me/")
        assert response.status_code in (401, 403)


class CertificateDetailEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint GET /certificates/{id}/ (vérification publique)."""

    # Vérifie qu'un certificat envoyé est consultable publiquement, sans authentification.
    def test_public_can_view_sent_certificate_without_authentication(self):
        certificate = CertificateFactory(status=Certificate.StatusCertificateEnum.SENT)
        response = self.client.get(f"{CERTIFICATES_URL}{certificate.id}/")
        assert response.status_code == 200
        assert response.data["status"] == Certificate.StatusCertificateEnum.SENT
        assert "learner_name" in response.data

    # Vérifie qu'un certificat en attente n'est pas consultable publiquement.
    def test_public_cannot_view_pending_certificate(self):
        certificate = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        response = self.client.get(f"{CERTIFICATES_URL}{certificate.id}/")
        assert response.status_code == 404


@patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
class CertificateGenerateEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint POST /certificates/generate/."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    # Vérifie qu'un administrateur peut déclencher la génération d'un certificat.
    def test_admin_can_generate_certificate(self, mock_render):
        enrollment = EnrollmentFactory()
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["status"] == Certificate.StatusCertificateEnum.PENDING

    # Vérifie qu'un utilisateur non-admin ne peut pas déclencher la génération.
    def test_non_admin_cannot_generate_certificate(self, mock_render):
        enrollment = EnrollmentFactory()
        learner = UserFactory()
        response = self.auth(learner).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 403

    # Vérifie que générer deux fois pour la même inscription ne crée pas de doublon.
    def test_generating_twice_does_not_duplicate_certificate(self, mock_render):
        enrollment = EnrollmentFactory()
        url = f"{CERTIFICATES_URL}generate/"
        data = {"enrollment_id": str(enrollment.id)}

        first_response = self.auth(self.admin).post(url, data, format="json")
        second_response = self.auth(self.admin).post(url, data, format="json")

        assert first_response.status_code == 201
        assert second_response.status_code == 200
        assert first_response.data["id"] == second_response.data["id"]
        assert Certificate.objects.filter(inscription=enrollment).count() == 1


@patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
class CertificatePdfGenerationTests(TestCase):
    """Tests du service de génération du PDF de certificat."""

    def tearDown(self):
        super().tearDown()
        from django.core.files.storage import default_storage
        # Nettoie les fichiers PDF générés pendant les tests.
        try:
            _, files = default_storage.listdir("certificates")
            for f in files:
                default_storage.delete(f"certificates/{f}")
        except FileNotFoundError:
            pass

    # Vérifie que la génération du PDF crée un fichier non vide et met à jour file_path.
    def test_generate_certificate_pdf_creates_file(self, mock_render):
        from apps.certificates.services import generate_certificate_pdf
        from django.core.files.storage import default_storage
        from django.utils import timezone

        certificate = CertificateFactory(
            status=Certificate.StatusCertificateEnum.SENT,
        )
        certificate.date_envoi = timezone.now()
        certificate.save(update_fields=["date_envoi"])

        result = generate_certificate_pdf(certificate)

        self.assertTrue(result.file_path)
        self.assertTrue(default_storage.exists(result.file_path))
        with default_storage.open(result.file_path, "rb") as f:
            content = f.read()
        self.assertGreater(len(content), 1000)


@patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
class CertificateEmailTaskTests(AuthAPITestCase):
    """Tests de bout en bout : generation -> Celery -> email avec piece jointe."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    # Vérifie que générer un certificat déclenche bien l'envoi d'un email avec le PDF joint.
    def test_generate_certificate_sends_email_with_attachment(self, mock_render):
        from django.core import mail

        enrollment = EnrollmentFactory()
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 201

        assert len(mail.outbox) == 1
        sent_email = mail.outbox[0]
        assert enrollment.user.email in sent_email.to
        assert len(sent_email.attachments) == 1

        attachment_name, attachment_content, attachment_mimetype = sent_email.attachments[0]
        assert attachment_name.endswith(".pdf")
        assert attachment_mimetype == "application/pdf"
        assert len(attachment_content) > 1000

    # Vérifie qu'un deuxième appel sur la même inscription ne renvoie pas d'email.
    def test_generating_twice_does_not_resend_email(self, mock_render):
        from django.core import mail

        enrollment = EnrollmentFactory()
        url = f"{CERTIFICATES_URL}generate/"
        data = {"enrollment_id": str(enrollment.id)}

        self.auth(self.admin).post(url, data, format="json")
        self.auth(self.admin).post(url, data, format="json")

        assert len(mail.outbox) == 1


class CertificateEdgeCaseTests(AuthAPITestCase):
    """Tests des cas limites non couverts par les autres classes."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    # Vérifie qu'un ID de certificat totalement inexistant renvoie 404, pas une erreur serveur.
    def test_detail_with_nonexistent_certificate_id_returns_404(self):
        import uuid

        random_id = uuid.uuid4()
        response = self.client.get(f"{CERTIFICATES_URL}{random_id}/")
        assert response.status_code == 404

    # Vérifie qu'un enrollment_id inexistant sur /generate/ renvoie 404, pas une erreur serveur.
    def test_generate_with_nonexistent_enrollment_returns_404(self):
        import uuid

        random_id = uuid.uuid4()
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(random_id)},
            format="json",
        )
        assert response.status_code == 404

    # Vérifie qu'un appel totalement non authentifié sur /generate/ est bloqué.
    def test_unauthenticated_user_cannot_generate_certificate(self):
        enrollment = EnrollmentFactory()
        response = self.client.post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code in (401, 403)


class CertificateEligibilityAndTriggerTests(AuthAPITestCase):
    """Tests du calcul d'éligibilité (seuil 80%) et du déclenchement automatique."""

    def setUp(self):
        super().setUp()
        from apps.cohorts.tests.factories import CohortFactory
        from apps.evaluations.models import ProjectAssignment
        from apps.programs.tests.factories import ProgramFactory
        from apps.projects.models import Project
        from apps.projects.tests.factories import ProjectFactory

        self.program = ProgramFactory()
        self.projects = [
            ProjectFactory(program=self.program, order=i, status=Project.StatusProjectEnum.PUBLISHED)
            for i in range(1, 6)
        ]  # 5 projets
        self.cohort = CohortFactory(program=self.program)
        self.learner = UserFactory()
        self.enrollment = EnrollmentFactory(cohort=self.cohort, user=self.learner)

    def test_eligibility_threshold_80_percent(self):
        from apps.certificates.services import is_eligible_for_certificate
        from apps.evaluations.models import ProjectAssignment

        # 0 validé (0%) -> Non éligible
        self.assertFalse(is_eligible_for_certificate(self.enrollment))

        # 3 validés sur 5 (60%) -> Non éligible (< 80%)
        for i in range(3):
            ProjectAssignment.objects.create(
                enrollment=self.enrollment,
                project=self.projects[i],
                status=ProjectAssignment.StatusEnum.VALIDATED,
            )
        self.assertFalse(is_eligible_for_certificate(self.enrollment))

        # 4ème validé (80%) -> Éligible (>= 80%)
        ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.projects[3],
            status=ProjectAssignment.StatusEnum.VALIDATED,
        )
        self.assertTrue(is_eligible_for_certificate(self.enrollment))

    @patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
    def test_trigger_certificate_if_eligible_creates_certificate_and_runs_pdf_task(self, mock_render):
        from apps.certificates.services import trigger_certificate_if_eligible
        from apps.certificates.tasks import generate_certificate_pdf_task
        from apps.evaluations.models import ProjectAssignment

        # Valider 4 projets sur 5 (80%)
        for i in range(4):
            ProjectAssignment.objects.create(
                enrollment=self.enrollment,
                project=self.projects[i],
                status=ProjectAssignment.StatusEnum.VALIDATED,
            )

        cert = trigger_certificate_if_eligible(self.enrollment)
        self.assertIsNotNone(cert)
        self.assertEqual(cert.status, Certificate.StatusCertificateEnum.PENDING)

        # Exécuter la tâche Celery de génération PDF
        generate_certificate_pdf_task(str(cert.id))

        cert.refresh_from_db()
        self.assertTrue(cert.file_path.endswith(".pdf"))

    @patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
    def test_send_certificate_email_reuses_existing_pdf_without_rendering_again(self, mock_render):
        from apps.certificates.services import trigger_certificate_if_eligible
        from apps.certificates.tasks import generate_certificate_pdf_task, send_certificate_email_task
        from apps.evaluations.models import ProjectAssignment
        from django.core import mail

        # 1. Valider 4 projets sur 5 (80%)
        for i in range(4):
            ProjectAssignment.objects.create(
                enrollment=self.enrollment,
                project=self.projects[i],
                status=ProjectAssignment.StatusEnum.VALIDATED,
            )

        cert = trigger_certificate_if_eligible(self.enrollment)
        # Générer le PDF une première fois
        generate_certificate_pdf_task(str(cert.id))
        self.assertEqual(mock_render.call_count, 1)

        # 2. Exécuter l'envoi officiel par email : le PDF ne doit PAS être régénéré
        mock_render.reset_mock()
        send_certificate_email_task(str(cert.id))

        mock_render.assert_not_called()  # Zéro rendu supplémentaire !

        cert.refresh_from_db()
        self.assertEqual(cert.status, Certificate.StatusCertificateEnum.SENT)
        self.assertIsNotNone(cert.date_envoi)

        # Vérifier que l'email est bien parti avec le PDF existant
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].attachments), 1)

    def test_delete_certificate_deletes_file_from_storage(self):
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage

        cert = Certificate.objects.create(inscription=self.enrollment)
        file_path = default_storage.save(f"certificates/{cert.id}.pdf", ContentFile(b"fake pdf content"))
        cert.file_path = file_path
        cert.save(update_fields=["file_path"])

        self.assertTrue(default_storage.exists(file_path))

        # Supprimer le certificat
        cert.delete()

        # Vérifier que le fichier physique a bien été supprimé par le signal post_delete
        self.assertFalse(default_storage.exists(file_path))


class CertificateAdminListEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint GET /certificates/ (liste admin / organisateur)."""

    def setUp(self):
        super().setUp()
        from apps.cohorts.tests.factories import CohortFactory
        from apps.programs.tests.factories import ProgramFactory

        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.learner = UserFactory()
        self.trainer = UserFactory(trainer=True)

        self.learner_linked = UserFactory(first_name="Alice", last_name="Martin")
        self.learner_linked.email = "alice.martin@test.fr"
        self.learner_linked.save()

        self.program = ProgramFactory()
        self.cohort = CohortFactory(program=self.program)
        self.enrollment = EnrollmentFactory(cohort=self.cohort, user=self.learner_linked)
        self.pending_cert = CertificateFactory(
            inscription=self.enrollment,
            status=Certificate.StatusCertificateEnum.PENDING,
        )

    def test_admin_can_list_certificates(self):
        response = self.auth(self.admin).get(f"{CERTIFICATES_URL}")
        assert response.status_code == 200
        assert "count" in response.data
        assert "results" in response.data
        assert response.data["count"] == 1
        assert response.data["results"][0]["learner_email"] == "alice.martin@test.fr"
        assert response.data["results"][0]["program_title"] == self.program.title
        assert response.data["results"][0]["cohort_name"] == self.cohort.name

    def test_organizer_can_list_certificates(self):
        response = self.auth(self.organizer).get(f"{CERTIFICATES_URL}")
        assert response.status_code == 200

    def test_learner_and_trainer_cannot_list_certificates(self):
        assert self.auth(self.learner).get(f"{CERTIFICATES_URL}").status_code == 403
        assert self.auth(self.trainer).get(f"{CERTIFICATES_URL}").status_code == 403

    def test_filter_by_status(self):
        sent_cert = CertificateFactory(status=Certificate.StatusCertificateEnum.SENT)
        response = self.auth(self.admin).get(f"{CERTIFICATES_URL}?status=ENVOYE")
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(sent_cert.id)

    def test_filter_by_program(self):
        other = CertificateFactory(
            inscription=EnrollmentFactory(),
            status=Certificate.StatusCertificateEnum.PENDING,
        )
        response = self.auth(self.admin).get(
            f"{CERTIFICATES_URL}?program={self.program.id}"
        )
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(self.pending_cert.id)
        assert other.id not in [r["id"] for r in response.data["results"]]

    def test_filter_by_cohort(self):
        other = CertificateFactory(
            inscription=EnrollmentFactory(),
            status=Certificate.StatusCertificateEnum.PENDING,
        )
        response = self.auth(self.admin).get(
            f"{CERTIFICATES_URL}?cohort={self.cohort.id}"
        )
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_filter_by_search_email(self):
        response = self.auth(self.admin).get(
            f"{CERTIFICATES_URL}?search=alice.martin"
        )
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_invalid_uuid_filter_returns_400(self):
        response = self.auth(self.admin).get(f"{CERTIFICATES_URL}?program=not-a-uuid")
        assert response.status_code == 400


@patch("apps.certificates.services._render_pdf_bytes", return_value=FAKE_PDF_BYTES)
class CertificateSendEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint POST /certificates/send/ (envoi groupé admin / organisateur)."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.learner = UserFactory()

    def test_admin_can_send_pending_certificates_bulk(self, mock_render):
        from django.core import mail

        c1 = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        c2 = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(c1.id), str(c2.id)]},
            format="json",
        )
        assert response.status_code == 200
        assert all(r["ok"] for r in response.data["results"])

        c1.refresh_from_db()
        c2.refresh_from_db()
        assert c1.status == Certificate.StatusCertificateEnum.SENT
        assert c2.status == Certificate.StatusCertificateEnum.SENT
        assert c1.sent_by == self.admin
        assert c2.sent_by == self.admin
        assert len(mail.outbox) == 2

    def test_organizer_can_send_pending_certificates(self, mock_render):
        cert = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        response = self.auth(self.organizer).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(cert.id)]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["results"][0]["ok"] is True
        cert.refresh_from_db()
        assert cert.sent_by == self.organizer

    def test_skips_already_sent_certificates(self, mock_render):
        from django.core import mail

        sent = CertificateFactory(status=Certificate.StatusCertificateEnum.SENT)
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(sent.id)]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["results"][0]["ok"] is False
        assert response.data["results"][0]["status"] == "skipped"
        assert len(mail.outbox) == 0

    def test_unknown_id_reports_not_found(self, mock_render):
        import uuid

        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(uuid.uuid4())]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["results"][0]["status"] == "not_found"

    def test_learner_and_trainer_cannot_send(self, mock_render):
        cert = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        payload = {"ids": [str(cert.id)]}
        assert (
            self.auth(self.learner).post(f"{CERTIFICATES_URL}send/", payload, format="json").status_code
            == 403
        )

    def test_missing_or_empty_ids_returns_400(self, mock_render):
        assert (
            self.auth(self.admin)
            .post(f"{CERTIFICATES_URL}send/", {}, format="json")
            .status_code
            == 400
        )
        assert (
            self.auth(self.admin)
            .post(f"{CERTIFICATES_URL}send/", {"ids": []}, format="json")
            .status_code
            == 400
        )

    def test_blocks_send_when_active_claim(self, mock_render):
        from django.core import mail

        from apps.claims.models import Claim
        from apps.claims.tests.factories import ClaimFactory

        cert = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        ClaimFactory(
            certificate=cert,
            status=Claim.StatusEnum.PENDING,
        )
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(cert.id)]},
            format="json",
        )
        assert response.status_code == 200
        result = response.data["results"][0]
        assert result["ok"] is False
        assert result["status"] == "claim_active"
        cert.refresh_from_db()
        assert cert.status == Certificate.StatusCertificateEnum.PENDING
        assert len(mail.outbox) == 0

    def test_blocks_send_when_in_progress_claim(self, mock_render):
        from django.core import mail

        from apps.claims.models import Claim
        from apps.claims.tests.factories import ClaimFactory

        cert = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        ClaimFactory(
            certificate=cert,
            status=Claim.StatusEnum.IN_PROGRESS,
        )
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(cert.id)]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["results"][0]["status"] == "claim_active"
        assert len(mail.outbox) == 0

    def test_allows_send_after_claim_resolved(self, mock_render):
        from django.core import mail

        from apps.claims.models import Claim
        from apps.claims.tests.factories import ClaimFactory

        cert = CertificateFactory(status=Certificate.StatusCertificateEnum.PENDING)
        ClaimFactory(
            certificate=cert,
            status=Claim.StatusEnum.RESOLVED,
        )
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}send/",
            {"ids": [str(cert.id)]},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["results"][0]["ok"] is True
        cert.refresh_from_db()
        assert cert.status == Certificate.StatusCertificateEnum.SENT
        assert len(mail.outbox) == 1

    def test_organizer_can_generate_certificate(self, mock_render):
        enrollment = EnrollmentFactory()
        response = self.auth(self.organizer).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 201



