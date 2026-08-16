from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

SESSIONS_URL = "/api/cohort-sessions/"


class SessionPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_sessions(self):
        assert self.client.get(SESSIONS_URL).status_code == 401

    def test_learner_cannot_list_sessions(self):
        learner = UserFactory()
        response = self.auth(learner).get(SESSIONS_URL)
        assert response.status_code == 403

    def test_trainer_cannot_create_session(self):
        trainer = UserFactory(trainer=True)
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-12-01",
            "status": "a_venir",
        }
        response = self.auth(trainer).post(SESSIONS_URL, data, format="json")
        assert response.status_code == 403