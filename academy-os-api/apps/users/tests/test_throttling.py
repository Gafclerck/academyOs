from django.core.cache import cache
from rest_framework.throttling import SimpleRateThrottle

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

LOGIN_URL = f"{API_PREFIX}/auth/login/"
FORGOT_URL = f"{API_PREFIX}/auth/forgot-password/"


class ThrottlingTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()

    def test_forgot_password_throttle(self):
        cache.clear()
        SimpleRateThrottle.THROTTLE_RATES["forgot"] = "5/hour"
        for _ in range(5):
            response = self.post_json(FORGOT_URL, {"email": self.learner.email})
            assert response.status_code == 200
        response = self.post_json(FORGOT_URL, {"email": self.learner.email})
        assert response.status_code == 429

    def test_login_throttle(self):
        cache.clear()
        SimpleRateThrottle.THROTTLE_RATES["login"] = "5/minute"
        for _ in range(5):
            response = self.post_json(
                LOGIN_URL, {"email": self.learner.email, "password": "wrong"}
            )
            assert response.status_code == 401
        response = self.post_json(
            LOGIN_URL, {"email": self.learner.email, "password": "wrong"}
        )
        assert response.status_code == 429