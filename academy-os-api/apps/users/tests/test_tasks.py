from unittest.mock import patch
from django.core import mail
from django.test import TestCase, override_settings

from apps.users.tasks import send_email_async
from apps.users.services import send_reset_password_email, send_invitation_email


class CeleryEmailTasksTests(TestCase):
    def test_send_email_async_direct_execution(self):
        """Vérifie que la tâche Celery send_email_async envoie correctement l'email."""
        mail.outbox = []
        result = send_email_async(
            subject="Test Sujet",
            message="Test Contenu du message",
            recipient_list=["destinataire@example.com"],
        )
        self.assertEqual(result, 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Test Sujet")
        self.assertEqual(mail.outbox[0].to, ["destinataire@example.com"])

    @patch("apps.users.services.send_email_async.delay")
    def test_services_dispatch_celery_task(self, mock_delay):
        """Vérifie que les services métiers appellent la tâche Celery asynchrone via .delay()."""
        send_reset_password_email("user@example.com", "123456")
        mock_delay.assert_called_once()
        args, kwargs = mock_delay.call_args
        self.assertIn("Réinitialisation", args[0])
        self.assertIn("123456", args[1])
        self.assertEqual(args[2], ["user@example.com"])

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_send_invitation_email_eager_mode(self):
        """Vérifie le fonctionnement de bout en bout en mode Eager (test local)."""
        mail.outbox = []
        send_invitation_email("invite@example.com", "654321")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["invite@example.com"])
        self.assertIn("654321", mail.outbox[0].body)
