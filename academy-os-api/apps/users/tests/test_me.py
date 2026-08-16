from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

ME_URL = "/api/auth/me/"


class MeTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()

    def test_me_requires_authentication(self):
        assert self.client.get(ME_URL).status_code == 401

    def test_me_returns_profile(self):
        self.learner.first_name = "Awa"
        self.learner.last_name = "Diop"
        self.learner.save()
        response = self.auth(self.learner).get(ME_URL)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == self.learner.email
        assert data["role"] == "learner"
        assert data["first_name"] == "Awa"
        assert data["last_name"] == "Diop"
        assert data["full_name"] == "Awa Diop"
        assert "created_at" in data

    def test_me_patch_updates_profile(self):
        response = self.auth(self.learner).patch(
            ME_URL,
            {"first_name": "Awa", "last_name": "Diop", "phone_number": "+221771234567"},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Awa"
        assert data["last_name"] == "Diop"
        assert data["phone_number"] == "+221771234567"

    def test_me_patch_cannot_change_role(self):
        response = self.auth(self.learner).patch(ME_URL, {"role": "admin"}, format="json")
        assert response.status_code == 200
        assert response.json()["role"] == "learner"

    def test_me_patch_cannot_change_email(self):
        response = self.auth(self.learner).patch(ME_URL, {"email": "pirate@test.fr"}, format="json")
        assert response.status_code == 200
        assert response.json()["email"] == self.learner.email