from django.core import mail
from django.utils import timezone

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import RESET_CODE, UserFactory, PasswordResetTokenFactory

FORGOT_URL = f"{API_PREFIX}/auth/forgot-password/"
RESET_URL = f"{API_PREFIX}/auth/reset-password/"
LOGIN_URL = f"{API_PREFIX}/auth/login/"
NEW_PASSWORD = "NouveauPass123!"


class PasswordResetTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()
        self.organizer = UserFactory(organizer=True)

    def _forgot(self, email):
        return self.post_json(FORGOT_URL, {"email": email})

    def test_forgot_known_email_sends_code(self):
        response = self._forgot(self.learner.email)
        assert response.status_code == 200
        assert len(mail.outbox) == 1
        assert self.get_code_from_last_email()

    def test_forgot_unknown_email_no_leak(self):
        response = self._forgot("inconnu@test.fr")
        assert response.status_code == 200
        assert len(mail.outbox) == 0

    def test_forgot_invalid_email(self):
        response = self._forgot("pas-un-email")
        assert response.status_code == 400

    def test_reset_success_then_login(self):
        self._forgot(self.learner.email)
        code = self.get_code_from_last_email()
        response = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": code, "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 200
        login = self.post_json(
            LOGIN_URL, {"email": self.learner.email, "password": NEW_PASSWORD}
        )
        assert login.status_code == 200

    def test_reset_wrong_code(self):
        self._forgot(self.learner.email)
        response = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": "000000", "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400

    def test_reset_code_single_use(self):
        self._forgot(self.learner.email)
        code = self.get_code_from_last_email()
        first = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": code, "new_password": NEW_PASSWORD},
        )
        assert first.status_code == 200
        second = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": code, "new_password": "EncoreAutre123!"},
        )
        assert second.status_code == 400

    def test_reset_unknown_email(self):
        response = self.post_json(
            RESET_URL,
            {"email": "inconnu@test.fr", "code": "000000", "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400

    def test_reset_expired_token(self):
        PasswordResetTokenFactory(
            user=self.learner,
            expires_at=timezone.now() - timezone.timedelta(minutes=1),
        )
        response = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": RESET_CODE, "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400

    def test_reset_weak_password(self):
        self._forgot(self.learner.email)
        code = self.get_code_from_last_email()
        response = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": code, "new_password": "12345678"},
        )
        assert response.status_code == 400

    def test_full_journey_invite_reset_login(self):
        self.auth(self.organizer).post(
            f"{API_PREFIX}/auth/invite/", {"email": "etudiant@test.fr", "role": "learner"}, format="json"
        )
        code = self.get_code_from_last_email()
        reset = self.post_json(
            RESET_URL,
            {"email": "etudiant@test.fr", "code": code, "new_password": NEW_PASSWORD},
        )
        assert reset.status_code == 200
        login = self.post_json(
            LOGIN_URL, {"email": "etudiant@test.fr", "password": NEW_PASSWORD}
        )
        assert login.status_code == 200