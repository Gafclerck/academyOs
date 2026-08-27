from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory, TrainerAssignmentFactory

PROGRAMS_URL = f"{API_PREFIX}/programs/"


class ProgramPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_programs(self):
        assert self.client.get(PROGRAMS_URL).status_code == 401

    def test_learner_can_list_programs_of_enrolled_cohorts(self):
        learner = UserFactory()
        cohort = CohortFactory()
        program = cohort.program
        EnrollmentFactory(user=learner, cohort=cohort)
        response = self.auth(learner).get(PROGRAMS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_learner_cannot_see_unenrolled_programs(self):
        learner = UserFactory()
        CohortFactory()
        response = self.auth(learner).get(PROGRAMS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 0

    def test_trainer_can_list_programs_of_assigned_cohorts(self):
        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        CohortFactory()
        response = self.auth(trainer).get(PROGRAMS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_trainer_cannot_create_program(self):
        trainer = UserFactory(trainer=True)
        data = {
            "title": "Data Engineering",
            "description": "Bootcamp Data",
            "status": "active",
        }
        response = self.auth(trainer).post(PROGRAMS_URL, data, format="json")
        assert response.status_code == 403