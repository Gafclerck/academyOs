from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import TEST_PASSWORD, UserFactory

LOGIN_URL = "/api/auth/login/"
REFRESH_URL = "/api/auth/token/refresh/"
LOGOUT_URL = "/api/auth/logout/"


class TokenTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()
        response = self.post_json(
            LOGIN_URL, {"email": self.learner.email, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        self.tokens = response.json()

    def test_refresh_rotates_tokens(self):
        response = self.post_json(REFRESH_URL, {"refresh": self.tokens["refresh"]})
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["refresh"] != self.tokens["refresh"]

    def test_refresh_blacklisted_token_rejected(self):
        first = self.post_json(REFRESH_URL, {"refresh": self.tokens["refresh"]})
        assert first.status_code == 200
        second = self.post_json(REFRESH_URL, {"refresh": self.tokens["refresh"]})
        assert second.status_code == 401

    def test_refresh_garbage_token_rejected(self):
        response = self.post_json(REFRESH_URL, {"refresh": "pas.un.token.valide"})
        assert response.status_code == 401

    def test_logout_requires_authentication(self):
        response = self.post_json(LOGOUT_URL, {"refresh": self.tokens["refresh"]})
        assert response.status_code == 401

    def test_logout_missing_refresh(self):
        response = self.auth(self.learner).post(LOGOUT_URL, {}, format="json")
        assert response.status_code == 400

    def test_logout_blacklists_refresh(self):
        response = self.auth(self.learner).post(
            LOGOUT_URL, {"refresh": self.tokens["refresh"]}, format="json"
        )
        assert response.status_code == 205
        refresh_response = self.post_json(REFRESH_URL, {"refresh": self.tokens["refresh"]})
        assert refresh_response.status_code == 401

    def test_logout_invalid_refresh(self):
        response = self.auth(self.learner).post(
            LOGOUT_URL, {"refresh": "pas.un.token"}, format="json"
        )
        assert response.status_code == 400