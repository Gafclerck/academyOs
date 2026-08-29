from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

from apps.cohorts.models import Enrollment
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

    def test_learner_default_lists_only_active_cohorts(self):
        learner = UserFactory()
        cohort_active = CohortFactory()
        cohort_completed = CohortFactory()
        EnrollmentFactory(
            user=learner,
            cohort=cohort_active,
            status=Enrollment.StatusEnum.ACTIVE,
        )
        EnrollmentFactory(
            user=learner,
            cohort=cohort_completed,
            status=Enrollment.StatusEnum.COMPLETED,
        )
        response = self.auth(learner).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(cohort_active.id)

    def test_learner_enrolled_all_includes_all_and_enriches(self):
        learner = UserFactory()
        cohort_active = CohortFactory()
        cohort_completed = CohortFactory()
        EnrollmentFactory(
            user=learner,
            cohort=cohort_active,
            status=Enrollment.StatusEnum.ACTIVE,
        )
        EnrollmentFactory(
            user=learner,
            cohort=cohort_completed,
            status=Enrollment.StatusEnum.COMPLETED,
        )
        response = self.auth(learner).get(COHORTS_URL, {"enrolled": "all"})
        assert response.status_code == 200
        assert response.data["count"] == 2
        by_id = {r["id"]: r for r in response.data["results"]}
        active_item = by_id[str(cohort_active.id)]
        completed_item = by_id[str(cohort_completed.id)]
        assert active_item["enrollment_status"] == "active"
        assert completed_item["enrollment_status"] == "completed"
        assert completed_item["enrolled_at"] is not None
        assert active_item["program_name"] == cohort_active.program.title
        assert active_item["intake_name"] == cohort_active.intake.name

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
