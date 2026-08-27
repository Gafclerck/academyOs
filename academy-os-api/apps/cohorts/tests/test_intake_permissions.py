from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

INTAKES_URL = f"{API_PREFIX}/intakes/"


class IntakePermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_intakes(self):
        assert self.client.get(INTAKES_URL).status_code == 401

    def test_learner_can_list_intakes(self):
        learner = UserFactory()
        response = self.auth(learner).get(INTAKES_URL)
        assert response.status_code == 200

    def test_trainer_cannot_create_intake(self):
        trainer = UserFactory(trainer=True)
        data = {
            "name": "Été 2026",
            "start_date": "2026-09-01",
            "status": "upcoming",
        }
        response = self.auth(trainer).post(INTAKES_URL, data, format="json")
        assert response.status_code == 403