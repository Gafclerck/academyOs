from django.core import mail

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.cohorts.models import Enrollment, TrainerAssignment

from .factories import CohortFactory, EnrollmentFactory, TrainerAssignmentFactory

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class EnrollmentEndpointTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.cohort = CohortFactory()
        self.organizer = UserFactory(organizer=True)
        self.url = f"{COHORTS_URL}{self.cohort.id}/enrollments/"

    def test_unauthenticated_cannot_access(self):
        assert self.client.get(self.url).status_code == 401

    def test_learner_forbidden(self):
        learner = UserFactory()
        assert self.auth(learner).get(self.url).status_code == 403

    def test_organizer_can_add_learners(self):
        learner = UserFactory()
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner.email]}, format="json"
        )
        assert response.status_code == 201
        assert response.data["results"][0]["status"] == "enrolled"
        assert Enrollment.objects.filter(cohort=self.cohort, user=learner).exists()

    def test_batch_results_mixed(self):
        learner = UserFactory()
        trainer = UserFactory(trainer=True)
        suspended = UserFactory(suspended=True)
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner.email, trainer.email, suspended.email, "nobody@test.fr"]},
            format="json",
        )
        results = {r["email"]: r["status"] for r in response.data["results"]}
        assert results[learner.email] == "enrolled"
        assert results[trainer.email] == "role_incompatible"
        assert results[suspended.email] == "user_inactive"
        assert results["nobody@test.fr"] == "not_found"

    def test_duplicate_enrollment_is_idempotent(self):
        learner = UserFactory()
        EnrollmentFactory(user=learner, cohort=self.cohort)
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner.email]}, format="json"
        )
        assert response.data["results"][0]["status"] == "already_enrolled"
        assert Enrollment.objects.filter(cohort=self.cohort, user=learner).count() == 1

    def test_emails_required(self):
        response = self.auth(self.organizer).post(self.url, {}, format="json")
        assert response.status_code == 400

    def test_empty_emails_rejected(self):
        response = self.auth(self.organizer).post(
            self.url, {"emails": []}, format="json"
        )
        assert response.status_code == 400

    def test_invalid_email_rejected(self):
        response = self.auth(self.organizer).post(
            self.url, {"emails": ["not-an-email"]}, format="json"
        )
        assert response.status_code == 400

    def test_list_enrollments_with_user(self):
        learner = UserFactory()
        EnrollmentFactory(user=learner, cohort=self.cohort)
        response = self.auth(self.organizer).get(self.url)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["user"]["email"] == learner.email

    def test_notification_sent_once_per_created(self):
        learner = UserFactory()
        self.auth(self.organizer).post(self.url, {"emails": [learner.email]}, format="json")
        assert len(mail.outbox) == 1
        assert "cohorte" in mail.outbox[0].subject.lower()


class TrainerAssignmentEndpointTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.cohort = CohortFactory()
        self.organizer = UserFactory(organizer=True)
        self.url = f"{COHORTS_URL}{self.cohort.id}/trainer-assignments/"

    def test_organizer_can_add_trainers(self):
        trainer = UserFactory(trainer=True)
        response = self.auth(self.organizer).post(
            self.url, {"emails": [trainer.email]}, format="json"
        )
        assert response.status_code == 201
        assert response.data["results"][0]["status"] == "assigned"
        assert TrainerAssignment.objects.filter(cohort=self.cohort, user=trainer).exists()

    def test_learner_email_role_incompatible(self):
        learner = UserFactory()
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner.email]}, format="json"
        )
        assert response.data["results"][0]["status"] == "role_incompatible"

    def test_duplicate_assignment_idempotent(self):
        trainer = UserFactory(trainer=True)
        TrainerAssignmentFactory(user=trainer, cohort=self.cohort)
        response = self.auth(self.organizer).post(
            self.url, {"emails": [trainer.email]}, format="json"
        )
        assert response.data["results"][0]["status"] == "already_assigned"

    def test_list_assignments(self):
        trainer = UserFactory(trainer=True)
        TrainerAssignmentFactory(user=trainer, cohort=self.cohort)
        response = self.auth(self.organizer).get(self.url)
        assert response.data["count"] == 1
        assert response.data["results"][0]["user"]["email"] == trainer.email

    def test_admin_can_access(self):
        admin = UserFactory(admin=True)
        assert self.auth(admin).get(self.url).status_code == 200

    def test_email_error_isolated_in_batch(self):
        from unittest.mock import patch

        learner1 = UserFactory()
        learner2 = UserFactory()
        url = f"{COHORTS_URL}{self.cohort.id}/enrollments/"

        with patch("apps.cohorts.services.send_added_to_cohort_email", side_effect=[Exception("SMTP error"), None]):
            response = self.auth(self.organizer).post(
                url, {"emails": [learner1.email, learner2.email]}, format="json"
            )
            assert response.status_code == 201
            assert len(response.data["results"]) == 2
            assert Enrollment.objects.filter(cohort=self.cohort, user=learner1).exists()
            assert Enrollment.objects.filter(cohort=self.cohort, user=learner2).exists()