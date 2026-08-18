from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import TEST_PASSWORD, UserFactory

LOGIN_URL = f"{API_PREFIX}/auth/login/"


class LoginTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()

    def test_login_returns_tokens(self):
        response = self.post_json(
            LOGIN_URL, {"email": self.learner.email, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data

    def test_login_wrong_password(self):
        response = self.post_json(
            LOGIN_URL, {"email": self.learner.email, "password": "mauvais"}
        )
        assert response.status_code == 401

    def test_login_unknown_email(self):
        response = self.post_json(
            LOGIN_URL, {"email": "inconnu@test.fr", "password": TEST_PASSWORD}
        )
        assert response.status_code == 401

    def test_login_inactive_user_rejected(self):
        suspended = UserFactory(suspended=True)
        response = self.post_json(
            LOGIN_URL, {"email": suspended.email, "password": TEST_PASSWORD}
        )
        assert response.status_code == 401

        pending = UserFactory(pending=True)
        response_pending = self.post_json(
            LOGIN_URL, {"email": pending.email, "password": TEST_PASSWORD}
        )
        assert response_pending.status_code == 401