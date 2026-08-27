from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

from .factories import CohortFactory, EnrollmentFactory, TrainerAssignmentFactory

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class CohortPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_cohorts(self):
        assert self.client.get(COHORTS_URL).status_code == 401

    def test_learner_can_list_own_enrolled_cohorts(self):
        learner = UserFactory()
        cohort = CohortFactory()
        EnrollmentFactory(user=learner, cohort=cohort)
        response = self.auth(learner).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_learner_cannot_list_unenrolled_cohorts(self):
        learner = UserFactory()
        CohortFactory()
        response = self.auth(learner).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 0

    def test_organizer_can_list_all_cohorts(self):
        organizer = UserFactory(organizer=True)
        CohortFactory()
        CohortFactory()
        response = self.auth(organizer).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_trainer_can_list_assigned_cohorts(self):
        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        CohortFactory()
        response = self.auth(trainer).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_trainer_cannot_create_cohort(self):
        trainer = UserFactory(trainer=True)
        response = self.auth(trainer).post(
            COHORTS_URL, {"name": "Cohorte"}, format="json"
        )
        assert response.status_code == 403

    def test_admin_can_delete_cohort_created_by_another(self):
        admin = UserFactory(admin=True)
        cohort = CohortFactory()
        response = self.auth(admin).delete(f"{COHORTS_URL}{cohort.id}/")
        assert response.status_code == 204
