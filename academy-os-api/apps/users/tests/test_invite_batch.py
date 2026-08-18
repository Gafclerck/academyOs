"""Tests de l'invitation en lot (emails) : résultats par email, connexion unique,
isolation des échecs d'envoi, activation du compte."""

from unittest.mock import patch

from django.core import mail

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User

INVITE_URL = f"{API_PREFIX}/auth/invite/"
RESET_URL = f"{API_PREFIX}/auth/reset-password/"
LOGIN_URL = f"{API_PREFIX}/auth/login/"
NEW_PASSWORD = "NouveauPass123!"


class InviteBatchTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.organizer = UserFactory(organizer=True)

    def test_batch_creates_users_and_returns_per_email_results(self):
        response = self.auth(self.organizer).post(
            INVITE_URL,
            {"emails": ["a@test.fr", "b@test.fr"], "role": "learner"},
            format="json",
        )
        assert response.status_code == 201
        results = response.data["results"]
        assert {r["email"] for r in results} == {"a@test.fr", "b@test.fr"}
        assert {r["status"] for r in results} == {"created"}
        for email in ("a@test.fr", "b@test.fr"):
            user = User.objects.get(email=email)
            assert user.role == User.Role.LEARNER
            assert user.is_active is False
        assert len(mail.outbox) == 2

    def test_batch_mixes_created_and_reused(self):
        existing = UserFactory()
        response = self.auth(self.organizer).post(
            INVITE_URL,
            {"emails": [existing.email, "nouveau@test.fr"]},
            format="json",
        )
        assert response.status_code == 201
        by_email = {r["email"]: r["status"] for r in response.data["results"]}
        assert by_email[existing.email] == "reused"
        assert by_email["nouveau@test.fr"] == "created"
        existing.refresh_from_db()
        assert existing.is_active is True  # un compte existant n'est pas désactivé

    def test_batch_rejects_invalid_email(self):
        response = self.auth(self.organizer).post(
            INVITE_URL,
            {"emails": ["a@test.fr", "pas-un-email"]},
            format="json",
        )
        assert response.status_code == 400

    def test_batch_requires_email_or_emails(self):
        response = self.auth(self.organizer).post(
            INVITE_URL, {"role": "learner"}, format="json"
        )
        assert response.status_code == 400

    def test_smtp_failure_does_not_abort_the_batch(self):
        def flaky_send_mail(subject, message, from_email, recipient_list, **kwargs):
            if "flaky@test.fr" in recipient_list:
                raise OSError("SMTP refused connection")

        with patch("apps.users.services.send_mail", side_effect=flaky_send_mail):
            response = self.auth(self.organizer).post(
                INVITE_URL,
                {"emails": ["ok@test.fr", "flaky@test.fr", "ok2@test.fr"]},
                format="json",
            )
        assert response.status_code == 201
        results = {r["email"]: r["status"] for r in response.data["results"]}
        assert results["flaky@test.fr"] == "error"
        assert results["ok@test.fr"] == "created"
        assert results["ok2@test.fr"] == "created"
        # Tous les comptes sont créés même si un envoi échoue.
        assert User.objects.filter(email__in=["ok@test.fr", "flaky@test.fr", "ok2@test.fr"]).count() == 3

    def test_batch_reuses_a_single_connection(self):
        with patch("apps.users.services.mail.get_connection") as get_conn:
            self.auth(self.organizer).post(
                INVITE_URL,
                {"emails": ["a@test.fr", "b@test.fr", "c@test.fr"]},
                format="json",
            )
        get_conn.assert_called_once()

    def test_invited_user_activation_sets_is_active_true(self):
        self.auth(self.organizer).post(
            INVITE_URL, {"emails": ["invite@test.fr"]}, format="json"
        )
        assert User.objects.get(email="invite@test.fr").is_active is False
        code = self.get_code_from_last_email()
        reset = self.post_json(
            RESET_URL,
            {"email": "invite@test.fr", "code": code, "new_password": NEW_PASSWORD},
        )
        assert reset.status_code == 200
        assert User.objects.get(email="invite@test.fr").is_active is True
        login = self.post_json(LOGIN_URL, {"email": "invite@test.fr", "password": NEW_PASSWORD})
        assert login.status_code == 200