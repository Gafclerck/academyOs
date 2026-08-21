from django.core import mail
from django.utils import timezone

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import RESET_CODE, UserFactory, PasswordResetTokenFactory
from apps.users.models import User

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

    def test_reset_on_pending_user_rejected(self):
        self.auth(self.organizer).post(
            f"{API_PREFIX}/auth/invite/", {"email": "etudiant@test.fr", "role": "learner"}, format="json"
        )
        code = self.get_code_from_last_email()
        reset = self.post_json(
            RESET_URL,
            {"email": "etudiant@test.fr", "code": code, "new_password": NEW_PASSWORD},
        )
        assert reset.status_code == 400
        assert "pas encore activé" in str(reset.data)


    def test_forgot_pending_user_resends_invitation_email(self):
        pending_user = UserFactory(pending=True)
        response = self._forgot(pending_user.email)
        assert response.status_code == 200
        assert len(mail.outbox) == 1
        assert "invit" in mail.outbox[0].subject.lower()

    def test_forgot_suspended_user_does_not_send_email(self):
        suspended_user = UserFactory(suspended=True)
        response = self._forgot(suspended_user.email)
        assert response.status_code == 200
        assert len(mail.outbox) == 0

    def test_reset_suspended_user_rejected(self):
        suspended = UserFactory(suspended=True)
        code = "123456"
        from apps.users.services import _hash_code
        from apps.users.models import PasswordResetToken
        PasswordResetToken.objects.create(
            user=suspended,
            token=_hash_code(code),
            expires_at=timezone.now() + timezone.timedelta(minutes=30),
        )
        response = self.post_json(
            RESET_URL,
            {"email": suspended.email, "code": code, "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400
        assert "désactivé" in str(response.data)

    def test_new_forgot_invalidates_previous_otp(self):
        self._forgot(self.learner.email)
        first_code = self.get_code_from_last_email()
        self._forgot(self.learner.email)
        second_code = self.get_code_from_last_email()
        assert first_code != second_code

        # Le premier code doit échouer
        response_old = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": first_code, "new_password": NEW_PASSWORD},
        )
        assert response_old.status_code == 400

        # Le second code doit réussir
        response_new = self.post_json(
            RESET_URL,
            {"email": self.learner.email, "code": second_code, "new_password": NEW_PASSWORD},
        )
        assert response_new.status_code == 200

    def test_forgot_archived_user_does_not_send_email(self):
        archived_user = UserFactory(archived=True)
        response = self._forgot(archived_user.email)
        assert response.status_code == 200
        assert len(mail.outbox) == 0

    def test_reset_archived_user_rejected(self):
        archived = UserFactory(archived=True)
        code = "123456"
        from apps.users.services import _hash_code
        from apps.users.models import PasswordResetToken
        PasswordResetToken.objects.create(
            user=archived,
            token=_hash_code(code),
            expires_at=timezone.now() + timezone.timedelta(minutes=30),
        )
        response = self.post_json(
            RESET_URL,
            {"email": archived.email, "code": code, "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400
        assert "désactivé" in str(response.data)

    def test_reset_password_pending_user_rejected_with_explicit_message(self):
        pending_user = UserFactory(pending=True)
        assert pending_user.status == User.Status.PENDING
        assert pending_user.is_active is False

        self._forgot(pending_user.email)
        code = self.get_code_from_last_email()
        response = self.post_json(
            RESET_URL,
            {"email": pending_user.email, "code": code, "new_password": NEW_PASSWORD},
        )
        assert response.status_code == 400
        assert "pas encore activé" in str(response.data)