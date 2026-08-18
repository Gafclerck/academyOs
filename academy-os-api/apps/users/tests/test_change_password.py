from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import TEST_PASSWORD, UserFactory

CHANGE_PASSWORD_URL = f"{API_PREFIX}/auth/change-password/"


class ChangePasswordTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()

    def test_change_password_requires_authentication(self):
        response = self.post_json(CHANGE_PASSWORD_URL, {})
        assert response.status_code == 401

    def test_change_password_wrong_old_password(self):
        response = self.auth(self.learner).post(
            CHANGE_PASSWORD_URL,
            {"old_password": "mauvais", "new_password": "NouveauPass123!"},
            format="json",
        )
        assert response.status_code == 400

    def test_change_password_weak_new_password(self):
        response = self.auth(self.learner).post(
            CHANGE_PASSWORD_URL,
            {"old_password": TEST_PASSWORD, "new_password": "12345678"},
            format="json",
        )
        assert response.status_code == 400

    def test_change_password_success(self):
        response = self.auth(self.learner).post(
            CHANGE_PASSWORD_URL,
            {"old_password": TEST_PASSWORD, "new_password": "NouveauPass123!"},
            format="json",
        )
        assert response.status_code == 200
        self.learner.refresh_from_db()
        assert self.learner.check_password("NouveauPass123!")
        assert not self.learner.check_password(TEST_PASSWORD)