from unittest.mock import patch
from django.core import mail
from django.test import TestCase, override_settings

from apps.users.tasks import send_email_async
from apps.users.services import send_reset_password_email, send_invitation_email, send_added_to_cohort_email


class CeleryEmailTasksTests(TestCase):
    def test_send_email_async_direct_execution(self):
        """Vérifie que la tâche Celery send_email_async envoie correctement l'email avec HTML."""
        mail.outbox = []
        result = send_email_async(
            subject="Test Sujet",
            message="Test Contenu du message",
            recipient_list=["destinataire@example.com"],
            html_message="<h1>Test HTML</h1>",
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
        self.assertIn("html_message", kwargs)
        self.assertIn("#FF7900", kwargs["html_message"])

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_send_invitation_email_eager_mode(self):
        """Vérifie le rendu complet du template HTML et du texte brut en mode Eager."""
        mail.outbox = []
        send_invitation_email("invite@example.com", "654321", role="trainer")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["invite@example.com"])
        self.assertIn("654321", mail.outbox[0].body)
        self.assertIn("Formateur", mail.outbox[0].body)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_send_added_to_cohort_email_eager_mode(self):
        """Vérifie le template d'affectation de cohorte."""
        mail.outbox = []
        send_added_to_cohort_email("apprenant@example.com", "Cohorte Baol 2026")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["apprenant@example.com"])
        self.assertIn("Cohorte Baol 2026", mail.outbox[0].body)
