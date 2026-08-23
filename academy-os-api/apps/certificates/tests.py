import factory
from django.test import TestCase

from apps.certificates.models import Certificate
from apps.cohorts.tests.factories import EnrollmentFactory
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User

CERTIFICATES_URL = "/api/v1/certificates/"


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


class CertificateGenerateEndpointTests(AuthAPITestCase):
    """Tests de l'endpoint POST /certificates/generate/."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    # Vérifie qu'un administrateur peut déclencher la génération d'un certificat.
    def test_admin_can_generate_certificate(self):
        enrollment = EnrollmentFactory()
        response = self.auth(self.admin).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["status"] == Certificate.StatusCertificateEnum.PENDING

    # Vérifie qu'un utilisateur non-admin ne peut pas déclencher la génération.
    def test_non_admin_cannot_generate_certificate(self):
        enrollment = EnrollmentFactory()
        learner = UserFactory()
        response = self.auth(learner).post(
            f"{CERTIFICATES_URL}generate/",
            {"enrollment_id": str(enrollment.id)},
            format="json",
        )
        assert response.status_code == 403

    # Vérifie que générer deux fois pour la même inscription ne crée pas de doublon.
    def test_generating_twice_does_not_duplicate_certificate(self):
        enrollment = EnrollmentFactory()
        url = f"{CERTIFICATES_URL}generate/"
        data = {"enrollment_id": str(enrollment.id)}

        first_response = self.auth(self.admin).post(url, data, format="json")
        second_response = self.auth(self.admin).post(url, data, format="json")

        assert first_response.status_code == 201
        assert second_response.status_code == 200
        assert first_response.data["id"] == second_response.data["id"]
        assert Certificate.objects.filter(inscription=enrollment).count() == 1


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
    def test_generate_certificate_pdf_creates_file(self):
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


class CertificateEmailTaskTests(AuthAPITestCase):
    """Tests de bout en bout : generation -> Celery -> email avec piece jointe."""

    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    # Vérifie que générer un certificat déclenche bien l'envoi d'un email avec le PDF joint.
    def test_generate_certificate_sends_email_with_attachment(self):
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
    def test_generating_twice_does_not_resend_email(self):
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
