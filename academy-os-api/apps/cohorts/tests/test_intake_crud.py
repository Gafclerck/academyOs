from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.models import Intake

from .factories import IntakeFactory

INTAKES_URL = f"{API_PREFIX}/intakes/"


class IntakeAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def valid_data(self):
        return {
            "name": "Été 2026",
            "start_date": "2026-09-01",
            "status": "ongoing",
        }

    def test_admin_can_list_intakes(self):
        intake = IntakeFactory()
        response = self.auth(self.admin).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["start_date"] == str(intake.start_date)

    def test_admin_can_create_intake(self):
        response = self.auth(self.admin).post(INTAKES_URL, self.valid_data(), format="json")
        assert response.status_code == 201
        assert response.data["name"] == "Été 2026"
        assert response.data["start_date"] == "2026-09-01"
        assert response.data["status"] == "ongoing"
        assert Intake.objects.filter(start_date="2026-09-01").exists()

    def test_admin_can_retrieve_intake(self):
        intake = IntakeFactory()
        response = self.auth(self.admin).get(f"{INTAKES_URL}{intake.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(intake.id)

    def test_admin_can_update_intake(self):
        intake = IntakeFactory()
        data = self.valid_data()
        data["name"] = "Été 2027"
        response = self.auth(self.admin).put(f"{INTAKES_URL}{intake.id}/", data, format="json")
        assert response.status_code == 200
        intake.refresh_from_db()
        assert intake.name == "Été 2027"
        assert str(intake.start_date) == "2026-09-01"
        assert intake.status == Intake.StatusEnum.ONGOING

    def test_admin_can_delete_intake(self):
        intake = IntakeFactory()
        response = self.auth(self.admin).delete(f"{INTAKES_URL}{intake.id}/")
        assert response.status_code == 204
        assert not Intake.objects.filter(id=intake.id).exists()

    def test_name_is_required(self):
        data = self.valid_data()
        del data["name"]
        response = self.auth(self.admin).post(INTAKES_URL, data, format="json")
        assert response.status_code == 400