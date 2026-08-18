from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.models import TrainerAssignment
from apps.cohorts.services import assign_mentor
from django.core.exceptions import ValidationError

from .factories import (
    CohortFactory,
    EnrollmentFactory,
    TrainerAssignmentFactory,
)

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class MentorServiceTests(AuthAPITestCase):
    def test_assign_mentor_same_cohort(self):
        cohort = CohortFactory()
        enrollment = EnrollmentFactory(cohort=cohort)
        mentor = TrainerAssignmentFactory(cohort=cohort)
        result = assign_mentor(enrollment, mentor)
        result.refresh_from_db()
        assert result.mentor == mentor

    def test_assign_mentor_cross_cohort_rejected(self):
        cohort_a = CohortFactory()
        cohort_b = CohortFactory()
        enrollment = EnrollmentFactory(cohort=cohort_a)
        mentor = TrainerAssignmentFactory(cohort=cohort_b)
        with self.assertRaises(ValidationError):
            assign_mentor(enrollment, mentor)

    def test_assign_mentor_idempotent(self):
        cohort = CohortFactory()
        enrollment = EnrollmentFactory(cohort=cohort)
        mentor = TrainerAssignmentFactory(cohort=cohort)
        assign_mentor(enrollment, mentor)
        assign_mentor(enrollment, mentor)
        enrollment.refresh_from_db()
        assert enrollment.mentor == mentor

    def test_assign_mentor_inactive_trainer_rejected(self):
        cohort = CohortFactory()
        enrollment = EnrollmentFactory(cohort=cohort)
        inactive_mentor = TrainerAssignmentFactory(
            cohort=cohort, status=TrainerAssignment.StatusEnum.SUSPENDED
        )
        with self.assertRaises(ValidationError):
            assign_mentor(enrollment, inactive_mentor)

    def test_unassign_mentor(self):
        cohort = CohortFactory()
        mentor = TrainerAssignmentFactory(cohort=cohort)
        enrollment = EnrollmentFactory(cohort=cohort, mentor=mentor)
        assign_mentor(enrollment, None)
        enrollment.refresh_from_db()
        assert enrollment.mentor is None


class MentorEndpointTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.cohort = CohortFactory()
        self.organizer = UserFactory(organizer=True)
        self.enrollment = EnrollmentFactory(cohort=self.cohort)
        self.mentor = TrainerAssignmentFactory(cohort=self.cohort)
        self.url = (
            f"{COHORTS_URL}{self.cohort.id}/enrollments/{self.enrollment.id}/"
        )

    def test_set_mentor(self):
        response = self.auth(self.organizer).patch(
            self.url, {"mentor": str(self.mentor.id)}, format="json"
        )
        assert response.status_code == 200
        self.enrollment.refresh_from_db()
        assert self.enrollment.mentor_id == self.mentor.id
        assert response.data["mentor"]["id"] == str(self.mentor.id)

    def test_unset_mentor_with_null(self):
        self.enrollment.mentor = self.mentor
        self.enrollment.save(update_fields=["mentor"])
        response = self.auth(self.organizer).patch(
            self.url, {"mentor": None}, format="json"
        )
        assert response.status_code == 200
        self.enrollment.refresh_from_db()
        assert self.enrollment.mentor is None

    def test_missing_mentor_field_rejected(self):
        response = self.auth(self.organizer).patch(
            self.url, {}, format="json"
        )
        assert response.status_code == 400
        assert "mentor" in response.data

    def test_cross_cohort_mentor_404(self):
        other_mentor = TrainerAssignmentFactory(cohort=CohortFactory())
        response = self.auth(self.organizer).patch(
            self.url, {"mentor": str(other_mentor.id)}, format="json"
        )
        assert response.status_code == 404

    def test_learner_forbidden(self):
        learner = UserFactory()
        assert self.auth(learner).patch(
            self.url, {"mentor": None}, format="json"
        ).status_code == 403

    def test_enrollment_unknown_404(self):
        from uuid import uuid4

        url = f"{COHORTS_URL}{self.cohort.id}/enrollments/{uuid4()}/"
        response = self.auth(self.organizer).patch(
            url, {"mentor": None}, format="json"
        )
        assert response.status_code == 404