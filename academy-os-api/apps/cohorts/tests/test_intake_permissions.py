from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory, IntakeFactory, TrainerAssignmentFactory

INTAKES_URL = f"{API_PREFIX}/intakes/"


class IntakePermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_intakes(self):
        assert self.client.get(INTAKES_URL).status_code == 401

    def test_learner_can_list_intakes_of_enrolled_cohorts(self):
        learner = UserFactory()
        cohort = CohortFactory()
        EnrollmentFactory(user=learner, cohort=cohort)
        IntakeFactory()
        response = self.auth(learner).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(cohort.intake.id)

    def test_learner_cannot_see_unenrolled_intakes(self):
        learner = UserFactory()
        IntakeFactory()
        response = self.auth(learner).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 0

    def test_trainer_can_list_intakes_of_assigned_cohorts(self):
        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        IntakeFactory()
        response = self.auth(trainer).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(cohort.intake.id)

    def test_trainer_cannot_see_unassigned_intakes(self):
        trainer = UserFactory(trainer=True)
        IntakeFactory()
        response = self.auth(trainer).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 0

    def test_organizer_can_list_all_intakes(self):
        organizer = UserFactory(organizer=True)
        IntakeFactory()
        IntakeFactory()
        response = self.auth(organizer).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_admin_can_list_all_intakes(self):
        admin = UserFactory(admin=True)
        IntakeFactory()
        IntakeFactory()
        response = self.auth(admin).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_trainer_cannot_create_intake(self):
        trainer = UserFactory(trainer=True)
        data = {
            "name": "Été 2026",
            "start_date": "2026-09-01",
            "status": "ongoing",
        }
        response = self.auth(trainer).post(INTAKES_URL, data, format="json")
        assert response.status_code == 403

    def test_learner_cannot_create_intake(self):
        learner = UserFactory()
        data = {
            "name": "Été 2026",
            "start_date": "2026-09-01",
            "status": "ongoing",
        }
        response = self.auth(learner).post(INTAKES_URL, data, format="json")
        assert response.status_code == 403

    def test_learner_can_retrieve_enrolled_intake(self):
        learner = UserFactory()
        cohort = CohortFactory()
        EnrollmentFactory(user=learner, cohort=cohort)
        response = self.auth(learner).get(f"{INTAKES_URL}{cohort.intake.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(cohort.intake.id)

    def test_learner_cannot_retrieve_unenrolled_intake(self):
        learner = UserFactory()
        intake = IntakeFactory()
        response = self.auth(learner).get(f"{INTAKES_URL}{intake.id}/")
        assert response.status_code == 404

    def test_trainer_can_retrieve_assigned_intake(self):
        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        response = self.auth(trainer).get(f"{INTAKES_URL}{cohort.intake.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(cohort.intake.id)

    def test_trainer_cannot_retrieve_unassigned_intake(self):
        trainer = UserFactory(trainer=True)
        intake = IntakeFactory()
        response = self.auth(trainer).get(f"{INTAKES_URL}{intake.id}/")
        assert response.status_code == 404

    def test_learner_with_inactive_enrollment_cannot_see_intake(self):
        learner = UserFactory()
        cohort = CohortFactory()
        EnrollmentFactory(user=learner, cohort=cohort, status="dropped")
        response = self.auth(learner).get(INTAKES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 0