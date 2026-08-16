from django.core import mail

from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

REGISTER_URL = "/api/auth/register/"


def _payload(email="user@test.fr", role="trainer", **extra):
    data = {"email": email, "role": role}
    data.update(extra)
    return data


class RegisterTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_register_requires_authentication(self):
        response = self.post_json(REGISTER_URL, _payload())
        assert response.status_code == 401

    def test_register_denied_for_non_admin(self):
        for user in (UserFactory(), UserFactory(organizer=True), UserFactory(trainer=True)):
            response = self.auth(user).post(REGISTER_URL, _payload(), format="json")
            assert response.status_code == 403

    def test_register_creates_organizer(self):
        response = self.auth(self.admin).post(
            REGISTER_URL, _payload(email="org@test.fr", role="organizer"), format="json"
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "org@test.fr"
        assert data["role"] == "organizer"
        assert "password" not in data
        assert len(mail.outbox) == 1
        assert self.get_code_from_last_email()

    def test_register_supports_all_roles(self):
        for role in ("admin", "organizer", "trainer", "learner"):
            email = f"new-{role}@test.fr"
            response = self.auth(self.admin).post(
                REGISTER_URL, _payload(email=email, role=role), format="json"
            )
            assert response.status_code == 201, response.data
            assert response.json()["role"] == role

    def test_register_duplicate_email_rejected(self):
        existing = UserFactory()
        response = self.auth(self.admin).post(
            REGISTER_URL, _payload(email=existing.email, role="learner"), format="json"
        )
        assert response.status_code == 400

    def test_register_invalid_role_rejected(self):
        response = self.auth(self.admin).post(REGISTER_URL, _payload(role="boss"), format="json")
        assert response.status_code == 400

    def test_register_persists_optional_fields(self):
        response = self.auth(self.admin).post(
            REGISTER_URL,
            _payload(
                email="profile@test.fr",
                role="learner",
                first_name="Awa",
                last_name="Diop",
                phone_number="+221771234567",
            ),
            format="json",
        )
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "Awa"
        assert data["last_name"] == "Diop"
        assert data["phone_number"] == "+221771234567"
        assert data["full_name"] == "Awa Diop"

    def test_registered_user_cannot_login_before_reset(self):
        self.auth(self.admin).post(
            REGISTER_URL, _payload(email="new@test.fr", role="trainer"), format="json"
        )
        response = self.post_json(
            "/api/auth/login/", {"email": "new@test.fr", "password": "whatever"}
        )
        assert response.status_code == 401