from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.models import TrainingPeriod

from .factories import TrainingPeriodFactory

PERIODS_URL = "/api/cohorts/"


class TrainingPeriodAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_admin_can_list_training_periods(self):
        training_period = TrainingPeriodFactory()
        response = self.auth(self.admin).get(PERIODS_URL)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["start_date"] == str(training_period.start_date)

    def test_admin_can_create_training_period(self):
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-12-01",
            "status": "ongoing",
        }
        response = self.auth(self.admin).post(PERIODS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["start_date"] == data["start_date"]
        assert response.data["end_date"] == data["end_date"]
        assert response.data["status"] == "ongoing"
        assert TrainingPeriod.objects.filter(start_date="2026-09-01").exists()

    def test_admin_can_retrieve_training_period(self):
        training_period = TrainingPeriodFactory()
        response = self.auth(self.admin).get(f"{PERIODS_URL}{training_period.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(training_period.id)

    def test_admin_can_update_training_period(self):
        training_period = TrainingPeriodFactory()
        data = {
            "start_date": "2026-10-01",
            "end_date": "2026-12-15",
            "status": "completed",
        }
        response = self.auth(self.admin).put(f"{PERIODS_URL}{training_period.id}/", data, format="json")
        assert response.status_code == 200
        training_period.refresh_from_db()
        assert str(training_period.start_date) == "2026-10-01"
        assert str(training_period.end_date) == "2026-12-15"
        assert training_period.status == TrainingPeriod.StatusEnum.COMPLETED

    def test_admin_can_delete_training_period(self):
        training_period = TrainingPeriodFactory()
        response = self.auth(self.admin).delete(f"{PERIODS_URL}{training_period.id}/")
        assert response.status_code == 204
        assert not TrainingPeriod.objects.filter(id=training_period.id).exists()

    def test_end_date_before_start_date_rejected(self):
        data = {
            "start_date": "2026-12-01",
            "end_date": "2026-09-01",
            "status": "upcoming",
        }
        response = self.auth(self.admin).post(PERIODS_URL, data, format="json")
        assert response.status_code == 400

    def test_end_date_equal_start_date_rejected(self):
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-09-01",
            "status": "upcoming",
        }
        response = self.auth(self.admin).post(PERIODS_URL, data, format="json")
        assert response.status_code == 400