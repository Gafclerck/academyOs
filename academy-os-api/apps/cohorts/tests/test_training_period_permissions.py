from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

PERIODS_URL = "/api/cohorts/"


class TrainingPeriodPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_training_periods(self):
        assert self.client.get(PERIODS_URL).status_code == 401

    def test_learner_cannot_list_training_periods(self):
        learner = UserFactory()
        response = self.auth(learner).get(PERIODS_URL)
        assert response.status_code == 403

    def test_trainer_cannot_create_training_period(self):
        trainer = UserFactory(trainer=True)
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-12-01",
            "status": "upcoming",
        }
        response = self.auth(trainer).post(PERIODS_URL, data, format="json")
        assert response.status_code == 403