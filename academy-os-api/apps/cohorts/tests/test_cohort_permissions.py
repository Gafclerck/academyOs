from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

from .factories import CohortFactory

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class CohortPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_cohorts(self):
        assert self.client.get(COHORTS_URL).status_code == 401

    def test_learner_cannot_list_cohorts(self):
        learner = UserFactory()
        response = self.auth(learner).get(COHORTS_URL)
        assert response.status_code == 403

    def test_trainer_cannot_create_cohort(self):
        trainer = UserFactory(trainer=True)
        response = self.auth(trainer).post(
            COHORTS_URL, {"name": "Cohorte"}, format="json"
        )
        assert response.status_code == 403

    def test_organizer_cannot_list_cohorts(self):
        organizer = UserFactory(organizer=True)
        response = self.auth(organizer).get(COHORTS_URL)
        assert response.status_code == 403

    def test_admin_can_delete_cohort_created_by_another(self):
        admin = UserFactory(admin=True)
        cohort = CohortFactory()
        response = self.auth(admin).delete(f"{COHORTS_URL}{cohort.id}/")
        assert response.status_code == 204
