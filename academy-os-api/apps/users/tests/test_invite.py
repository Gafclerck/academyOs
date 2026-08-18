from django.core import mail

from apps.users.models import User

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import TEST_PASSWORD, UserFactory

INVITE_URL = f"{API_PREFIX}/auth/invite/"

class InviteTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.organizer = UserFactory(organizer=True)

    def test_invite_requires_authentication(self):
        response = self.post_json(INVITE_URL, {"email": "x@test.fr"})
        assert response.status_code == 401

    def test_invite_denied_for_learner_and_trainer(self):
        for user in (UserFactory(), UserFactory(trainer=True)):
            response = self.auth(user).post(
                INVITE_URL, {"email": "x@test.fr", "role": "trainer"}, format="json"
            )
            assert response.status_code == 403

    def test_invite_trainer_by_organizer(self):
        response = self.auth(self.organizer).post(
            INVITE_URL, {"email": "formateur@test.fr", "role": "trainer"}, format="json"
        )
        assert response.status_code == 201
        user = User.objects.get(email="formateur@test.fr")
        assert user.role == User.Role.TRAINER
        assert user.has_usable_password() is False
        assert user.is_active is False
        assert len(mail.outbox) == 1
        assert self.get_code_from_last_email()

    def test_invite_learner_default_role(self):
        response = self.auth(self.organizer).post(
            INVITE_URL, {"email": "apprenant@test.fr"}, format="json"
        )
        assert response.status_code == 201
        user = User.objects.get(email="apprenant@test.fr")
        assert user.role == User.Role.LEARNER
        assert user.is_active is False

    def test_invite_admin_role_rejected(self):
        response = self.auth(self.organizer).post(
            INVITE_URL, {"email": "boss@test.fr", "role": "admin"}, format="json"
        )
        assert response.status_code == 400

    def test_invite_existing_user_returns_200(self):
        existing = UserFactory()
        response = self.auth(self.organizer).post(
            INVITE_URL, {"email": existing.email, "role": "trainer"}, format="json"
        )
        assert response.status_code == 200
        assert len(mail.outbox) == 1

    def test_invited_user_cannot_login_before_reset(self):
        self.auth(self.organizer).post(
            INVITE_URL, {"email": "invite@test.fr", "role": "learner"}, format="json"
        )
        response = self.post_json(
            f"{API_PREFIX}/auth/login/", {"email": "invite@test.fr", "password": TEST_PASSWORD}
        )
        assert response.status_code == 401