from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.models import Cohort, Intake
from apps.programs.models import Program

from .factories import CohortFactory, IntakeFactory

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class CohortAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.program = Program.objects.create(title="Programme test")
        self.intake = IntakeFactory(start_date="2026-01-01")

    def valid_data(self):
        return {
            "name": "Cohorte 2026",
            "description": "Première cohorte",
            "program": str(self.program.id),
            "intake": str(self.intake.id),
            "start_date": "2026-03-01",
            "end_date": "2026-06-30",
            "status": "upcoming",
        }

    def test_admin_can_list_cohorts(self):
        cohort = CohortFactory()
        response = self.auth(self.admin).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == cohort.name

    def test_admin_can_create_cohort(self):
        response = self.auth(self.admin).post(
            COHORTS_URL, self.valid_data(), format="json"
        )
        assert response.status_code == 201
        assert response.data["program"] == self.program.id
        assert response.data["description"] == "Première cohorte"
        assert Cohort.objects.filter(name="Cohorte 2026").exists()

    def test_admin_can_retrieve_cohort(self):
        cohort = CohortFactory()
        response = self.auth(self.admin).get(f"{COHORTS_URL}{cohort.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(cohort.id)
        assert response.data["program"] == cohort.program_id

    def test_admin_can_update_cohort(self):
        cohort = CohortFactory()
        data = self.valid_data()
        data["name"] = "Cohorte renommée"
        response = self.auth(self.admin).put(
            f"{COHORTS_URL}{cohort.id}/", data, format="json"
        )
        assert response.status_code == 200
        cohort.refresh_from_db()
        assert cohort.name == "Cohorte renommée"
        assert cohort.status == Cohort.StatusEnum.UPCOMING

    def test_admin_can_delete_cohort(self):
        cohort = CohortFactory()
        response = self.auth(self.admin).delete(f"{COHORTS_URL}{cohort.id}/")
        assert response.status_code == 204
        assert not Cohort.objects.filter(id=cohort.id).exists()

    def test_program_is_required(self):
        data = self.valid_data()
        del data["program"]
        response = self.auth(self.admin).post(COHORTS_URL, data, format="json")
        assert response.status_code == 400

    def test_intake_is_required(self):
        data = self.valid_data()
        del data["intake"]
        response = self.auth(self.admin).post(COHORTS_URL, data, format="json")
        assert response.status_code == 400

    def test_start_date_defaults_to_intake_start(self):
        data = self.valid_data()
        del data["start_date"]
        response = self.auth(self.admin).post(COHORTS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["start_date"] == str(self.intake.start_date)

    def test_start_date_before_intake_rejected(self):
        data = self.valid_data()
        data["start_date"] = "2025-12-01"
        response = self.auth(self.admin).post(COHORTS_URL, data, format="json")
        assert response.status_code == 400

    def test_end_date_before_start_date_rejected(self):
        data = self.valid_data()
        data["start_date"] = "2026-06-30"
        data["end_date"] = "2026-03-01"
        response = self.auth(self.admin).post(COHORTS_URL, data, format="json")
        assert response.status_code == 400