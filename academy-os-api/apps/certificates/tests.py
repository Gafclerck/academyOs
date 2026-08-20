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
