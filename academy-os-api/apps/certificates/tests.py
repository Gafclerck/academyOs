from django.test import TestCase

from apps.certificates.models import Certificate
from apps.users.models import User


class CertificateModelTests(TestCase):
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

    def test_certificate_has_a_unique_uuid(self):
        certificate_1 = Certificate.objects.create()
        certificate_2 = Certificate.objects.create()

        self.assertNotEqual(certificate_1.id, certificate_2.id)
