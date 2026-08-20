from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError

from apps.attachments.models import Attachment
from apps.cohorts.models import Enrollment
from apps.cohorts.services import add_users_to_cohort
from apps.cohorts.tests.factories import (
    CohortFactory,
    EnrollmentFactory,
    TrainerAssignmentFactory,
)
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import Deliverable, ProjectAssignment
from apps.evaluations.services import (
    create_assignments_for_enrollment,
    create_assignments_for_project,
)
from apps.evaluations.tests.factories import (
    DeliverableFactory,
    ProjectAssignmentFactory,
)
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory

ASSIGNMENTS_URL = "/api/v1/evaluations/assignments/"
DELIVERABLES_URL = "/api/v1/evaluations/deliverables/"


# ─────────────────────────────────────────────
# Assignations de projet
# ─────────────────────────────────────────────


class ProjectAssignmentTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner1 = UserFactory()
        self.learner2 = UserFactory()

        self.cohort = CohortFactory()
        self.enrollment1 = EnrollmentFactory(user=self.learner1, cohort=self.cohort)
        self.enrollment2 = EnrollmentFactory(user=self.learner2, cohort=self.cohort)
        self.project = ProjectFactory(
            program=self.cohort.program,
            status=Project.StatusProjectEnum.PUBLISHED,
        )

    def test_admin_can_create_assignment(self):
        data = {
            "enrollment": str(self.enrollment1.id),
            "project": str(self.project.id),
        }
        response = self.auth(self.admin).post(ASSIGNMENTS_URL, data, format="json")
        assert response.status_code == 201
        assert str(response.data["enrollment"]) == str(self.enrollment1.id)
        assert str(response.data["project"]) == str(self.project.id)
        assert response.data["status"] == "pending"

    def test_unique_assignment_constraint(self):
        ProjectAssignmentFactory(enrollment=self.enrollment1, project=self.project)
        with self.assertRaises(IntegrityError):
            ProjectAssignment.objects.create(
                enrollment=self.enrollment1,
                project=self.project,
            )

    def test_learner_only_sees_own_assignments(self):
        assign1 = ProjectAssignmentFactory(enrollment=self.enrollment1, project=self.project)
        ProjectAssignmentFactory(enrollment=self.enrollment2, project=self.project)

        response = self.auth(self.learner1).get(ASSIGNMENTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(assign1.id)

    def test_filtering_assignments_by_cohort_and_status(self):
        cohort2 = CohortFactory()
        enrollment_other = EnrollmentFactory(cohort=cohort2)
        a1 = ProjectAssignmentFactory(
            enrollment=self.enrollment1,
            project=self.project,
            status=ProjectAssignment.StatusEnum.SUBMITTED,
        )
        ProjectAssignmentFactory(
            enrollment=self.enrollment2,
            project=self.project,
            status=ProjectAssignment.StatusEnum.PENDING,
        )
        ProjectAssignmentFactory(
            enrollment=enrollment_other,
            project=self.project,
            status=ProjectAssignment.StatusEnum.SUBMITTED,
        )

        response = self.auth(self.admin).get(
            f"{ASSIGNMENTS_URL}?cohort={self.cohort.id}&status=submitted"
        )
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(a1.id)

    def test_program_mismatch_rejected(self):
        other_program = ProgramFactory()
        wrong_project = ProjectFactory(program=other_program)
        data = {
            "enrollment": str(self.enrollment1.id),
            "project": str(wrong_project.id),
        }
        response = self.auth(self.admin).post(ASSIGNMENTS_URL, data, format="json")
        assert response.status_code == 400
        assert "project" in response.data


# ─────────────────────────────────────────────
# Soumission de livrables
# ─────────────────────────────────────────────


class DeliverableSubmissionTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.learner = UserFactory()
        self.other_learner = UserFactory()
        self.enrollment = EnrollmentFactory(user=self.learner)
        self.assignment = ProjectAssignmentFactory(enrollment=self.enrollment)

    def _submit_url(self):
        return f"{ASSIGNMENTS_URL}{self.assignment.id}/deliverables/submit/"

    def _reject_as_admin(self):
        deliverable = self.assignment.deliverables.first()
        if deliverable is None:
            deliverable = DeliverableFactory(assignment=self.assignment)
        deliverable.status = Deliverable.StatusEnum.REJECTED
        deliverable.reviewed_by = self.admin
        deliverable.reviewed_at = "2026-01-01T00:00:00Z"
        deliverable.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        self.assignment.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        self.assignment.save(update_fields=["status", "updated_at"])

    def test_learner_can_submit_deliverable(self):
        url = self._submit_url()
        data = {
            "repo_url": "https://github.com/learner/xarala-api",
            "live_url": "https://xarala-api.vercel.app",
            "comments": "Voici mon rendu pour le projet final.",
        }
        response = self.auth(self.learner).post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["version"] == 1
        assert response.data["status"] == "submitted"
        assert response.data["repo_url"] == data["repo_url"]

        self.assignment.refresh_from_db()
        assert self.assignment.status == ProjectAssignment.StatusEnum.SUBMITTED

    def test_resubmission_after_rejection_increments_version(self):
        url = self._submit_url()
        r1 = self.auth(self.learner).post(url, {"comments": "V1"}, format="json")
        assert r1.status_code == 201
        assert r1.data["version"] == 1

        self._reject_as_admin()

        r2 = self.auth(self.learner).post(url, {"comments": "V2 corrigée"}, format="json")
        assert r2.status_code == 201
        assert r2.data["version"] == 2
        assert self.assignment.deliverables.count() == 2

    def test_cannot_submit_while_already_submitted(self):
        url = self._submit_url()
        self.auth(self.learner).post(url, {"comments": "V1"}, format="json")
        self.assignment.refresh_from_db()
        assert self.assignment.status == ProjectAssignment.StatusEnum.SUBMITTED

        response = self.auth(self.learner).post(url, {"comments": "V2"}, format="json")
        assert response.status_code == 400

    def test_submit_with_attachment_file(self):
        url = self._submit_url()
        file = SimpleUploadedFile("rapport.pdf", b"%PDF-1.4 content", content_type="application/pdf")
        data = {
            "comments": "Rapport avec PDF joint",
            "file": file,
        }
        response = self.auth(self.learner).post(url, data, format="multipart")
        assert response.status_code == 201
        assert len(response.data["attachments"]) == 1
        assert response.data["attachments"][0]["original_filename"] == "rapport.pdf"

    def test_other_learner_cannot_submit(self):
        url = self._submit_url()
        response = self.auth(self.other_learner).post(url, {"comments": "Hacking"}, format="json")
        assert response.status_code == 403

    def test_unauthenticated_cannot_submit(self):
        url = self._submit_url()
        response = self.client.post(url, {"comments": "No auth"}, format="json")
        assert response.status_code == 401

    def test_cannot_submit_on_validated_assignment(self):
        self.assignment.status = ProjectAssignment.StatusEnum.VALIDATED
        self.assignment.save(update_fields=["status"])
        url = self._submit_url()
        response = self.auth(self.learner).post(url, {"comments": "Tardif"}, format="json")
        assert response.status_code == 400

    def test_can_submit_after_rejection(self):
        self.assignment.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        self.assignment.save(update_fields=["status"])
        url = self._submit_url()
        response = self.auth(self.learner).post(url, {"comments": "Nouvelle tentative"}, format="json")
        assert response.status_code == 201


# ─────────────────────────────────────────────
# Correction de livrables
# ─────────────────────────────────────────────


class DeliverableReviewTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

        self.cohort = CohortFactory()
        TrainerAssignmentFactory(user=self.trainer, cohort=self.cohort)
        self.enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        self.assignment = ProjectAssignmentFactory(enrollment=self.enrollment)
        self.deliverable = DeliverableFactory(assignment=self.assignment)

    def test_trainer_can_review_and_validate_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "validated",
            "score": 95,
            "feedback": "Excellent travail, architecture propre et code documenté.",
        }
        response = self.auth(self.trainer).post(url, data, format="json")
        assert response.status_code == 200
        assert response.data["status"] == "validated"
        assert response.data["score"] == 95
        assert response.data["feedback"] == data["feedback"]
        assert str(response.data["reviewed_by"]) == str(self.trainer.id)

        self.assignment.refresh_from_db()
        assert self.assignment.status == ProjectAssignment.StatusEnum.VALIDATED
        assert self.assignment.final_score == 95

    def test_trainer_can_review_and_reject_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "rejected",
            "score": 40,
            "feedback": "Des erreurs bloquantes sur les migrations. À retravailler.",
        }
        response = self.auth(self.trainer).post(url, data, format="json")
        assert response.status_code == 200
        assert response.data["status"] == "rejected"

        self.assignment.refresh_from_db()
        assert self.assignment.status == ProjectAssignment.StatusEnum.IN_PROGRESS
        assert self.assignment.final_score is None

    def test_learner_cannot_review_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "validated",
            "score": 100,
            "feedback": "Auto-validation interdite.",
        }
        response = self.auth(self.learner).post(url, data, format="json")
        assert response.status_code == 403

    def test_unauthenticated_cannot_review(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        response = self.client.post(url, {"status": "validated", "score": 80}, format="json")
        assert response.status_code == 401

    def test_other_trainer_cannot_review_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {"status": "validated", "score": 80, "feedback": "Bien."}
        response = self.auth(self.other_trainer).post(url, data, format="json")
        assert response.status_code == 403

    def test_validation_advances_next_assignment(self):
        project1 = ProjectFactory(
            program=self.cohort.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=1,
        )
        project2 = ProjectFactory(
            program=self.cohort.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=2,
        )
        assignment1 = ProjectAssignmentFactory(
            enrollment=self.enrollment,
            project=project1,
        )
        next_assignment = ProjectAssignmentFactory(
            enrollment=self.enrollment,
            project=project2,
            status=ProjectAssignment.StatusEnum.PENDING,
        )
        deliverable = DeliverableFactory(assignment=assignment1)

        url = f"{DELIVERABLES_URL}{deliverable.id}/review/"
        data = {"status": "validated", "score": 90, "feedback": "Bien."}
        self.auth(self.trainer).post(url, data, format="json")

        next_assignment.refresh_from_db()
        assert next_assignment.status == ProjectAssignment.StatusEnum.IN_PROGRESS

    def test_deleting_deliverable_purges_attachments_cascade(self):
        file = SimpleUploadedFile("archive.zip", b"PK...", content_type="application/zip")
        submit_url = f"{ASSIGNMENTS_URL}{self.assignment.id}/deliverables/submit/"
        resp = self.auth(self.learner).post(
            submit_url,
            {"comments": "Avec zip", "file": file},
            format="multipart",
        )
        deliv_id = resp.data["id"]
        assert Attachment.objects.filter(object_id=deliv_id).count() == 1

        Deliverable.objects.filter(id=deliv_id).delete()
        assert Attachment.objects.filter(object_id=deliv_id).count() == 0


# ─────────────────────────────────────────────
# Liste de livrables
# ─────────────────────────────────────────────


class DeliverableListTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()
        self.other_learner = UserFactory()

        self.cohort = CohortFactory()
        TrainerAssignmentFactory(user=self.trainer, cohort=self.cohort)
        self.enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        self.assignment = ProjectAssignmentFactory(enrollment=self.enrollment)
        self.deliverable = DeliverableFactory(assignment=self.assignment)
        self.list_url = f"{ASSIGNMENTS_URL}{self.assignment.id}/deliverables/"

    def test_learner_can_list_own_deliverables(self):
        response = self.auth(self.learner).get(self.list_url)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(self.deliverable.id)

    def test_other_learner_cannot_list(self):
        response = self.auth(self.other_learner).get(self.list_url)
        assert response.status_code == 403

    def test_trainer_of_cohort_can_list(self):
        response = self.auth(self.trainer).get(self.list_url)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_other_trainer_cannot_list(self):
        response = self.auth(self.other_trainer).get(self.list_url)
        assert response.status_code == 403

    def test_admin_can_list(self):
        response = self.auth(self.admin).get(self.list_url)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_unauthenticated_cannot_list(self):
        response = self.client.get(self.list_url)
        assert response.status_code == 401

    def test_list_versioned_deliverables(self):
        DeliverableFactory(assignment=self.assignment, version=2)
        response = self.auth(self.learner).get(self.list_url)
        assert response.data["count"] == 2


# ─────────────────────────────────────────────
# Détail de livrable
# ─────────────────────────────────────────────


class DeliverableDetailTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()
        self.other_learner = UserFactory()

        self.cohort = CohortFactory()
        TrainerAssignmentFactory(user=self.trainer, cohort=self.cohort)
        self.enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        self.assignment = ProjectAssignmentFactory(enrollment=self.enrollment)
        self.deliverable = DeliverableFactory(assignment=self.assignment)
        self.detail_url = f"{DELIVERABLES_URL}{self.deliverable.id}/"

    def test_learner_can_detail_own(self):
        response = self.auth(self.learner).get(self.detail_url)
        assert response.status_code == 200
        assert response.data["id"] == str(self.deliverable.id)

    def test_other_learner_forbidden(self):
        response = self.auth(self.other_learner).get(self.detail_url)
        assert response.status_code == 403

    def test_trainer_of_cohort_can_detail(self):
        response = self.auth(self.trainer).get(self.detail_url)
        assert response.status_code == 200

    def test_other_trainer_forbidden(self):
        response = self.auth(self.other_trainer).get(self.detail_url)
        assert response.status_code == 403

    def test_admin_can_detail(self):
        response = self.auth(self.admin).get(self.detail_url)
        assert response.status_code == 200


# ─────────────────────────────────────────────
# Auto-assignation à l'inscription
# ─────────────────────────────────────────────


class AutoAssignmentTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.learner = UserFactory()
        self.cohort = CohortFactory()
        self.program = self.cohort.program
        self.project1 = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=1,
        )
        self.project2 = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=2,
        )
        self.project_draft = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.DRAFT,
            order=3,
        )

    def test_auto_assignment_on_enrollment(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        assignments = ProjectAssignment.objects.filter(enrollment=enrollment)
        assert assignments.count() == 2
        assert set(assignments.values_list("project_id", flat=True)) == {
            self.project1.id,
            self.project2.id,
        }

    def test_first_project_starts_in_progress(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        a1 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project1)
        assert a1.status == ProjectAssignment.StatusEnum.IN_PROGRESS

    def test_subsequent_project_starts_pending(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        a2 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project2)
        assert a2.status == ProjectAssignment.StatusEnum.PENDING

    def test_auto_assignment_only_published_projects(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        assert not ProjectAssignment.objects.filter(
            enrollment=enrollment, project=self.project_draft
        ).exists()

    def test_no_duplicate_auto_assignment(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)
        create_assignments_for_enrollment(enrollment)

        assert ProjectAssignment.objects.filter(enrollment=enrollment).count() == 2

    def test_subsequent_starts_in_progress_when_previous_validated(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        a1 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project1)
        a1.status = ProjectAssignment.StatusEnum.VALIDATED
        a1.save(update_fields=["status"])

        a2 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project2)
        a2.status = ProjectAssignment.StatusEnum.PENDING
        a2.save(update_fields=["status"])

        from apps.evaluations.services import _determine_initial_status
        status = _determine_initial_status(enrollment, self.project2)
        assert status == ProjectAssignment.StatusEnum.IN_PROGRESS


# ─────────────────────────────────────────────
# Auto-assignation via publication de projet
# ─────────────────────────────────────────────


class ProjectPublicationSyncTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.program = ProgramFactory()
        self.cohort = CohortFactory(program=self.program)
        self.learner = UserFactory()
        self.enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        self.project = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.DRAFT,
            order=1,
        )

    def test_publishing_project_creates_assignments(self):
        self.project.status = Project.StatusProjectEnum.PUBLISHED
        self.project.save(update_fields=["status"])

        count = create_assignments_for_project(self.project)
        assert count == 1
        assert ProjectAssignment.objects.filter(
            enrollment=self.enrollment, project=self.project
        ).exists()

    def test_no_assignment_for_draft_project(self):
        count = create_assignments_for_project(self.project)
        assert count == 0
        assert not ProjectAssignment.objects.filter(project=self.project).exists()

    def test_no_duplicate_on_republish(self):
        create_assignments_for_project(self.project)
        count = create_assignments_for_project(self.project)
        assert count == 0

    def test_publishing_via_api_creates_assignments(self):
        url = f"/api/v1/projects/{self.project.id}/"
        data = {"status": Project.StatusProjectEnum.PUBLISHED}
        self.auth(self.admin).patch(url, data, format="json")

        assert ProjectAssignment.objects.filter(
            enrollment=self.enrollment, project=self.project
        ).exists()

    def test_only_active_enrollments_get_assignments(self):
        self.enrollment.status = Enrollment.StatusEnum.DROPPED
        self.enrollment.save(update_fields=["status"])

        self.project.status = Project.StatusProjectEnum.PUBLISHED
        self.project.save(update_fields=["status"])
        count = create_assignments_for_project(self.project)

        assert count == 0


# ─────────────────────────────────────────────
# Tests d'intégration auto-assign via endpoint
# ─────────────────────────────────────────────


class EnrollmentIntegrationTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.organizer = UserFactory(organizer=True)
        self.cohort = CohortFactory()
        self.program = self.cohort.program
        self.project1 = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=1,
        )
        self.project2 = ProjectFactory(
            program=self.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=2,
        )
        self.url = f"/api/v1/cohorts/{self.cohort.id}/enrollments/"

    def test_enrollment_via_api_creates_assignments(self):
        learner = UserFactory()
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner.email]}, format="json"
        )
        assert response.status_code == 201
        assert response.data["results"][0]["status"] == "enrolled"

        enrollment = Enrollment.objects.get(user=learner, cohort=self.cohort)
        assignments = ProjectAssignment.objects.filter(enrollment=enrollment)
        assert assignments.count() == 2
        assert assignments.filter(project=self.project1, status="in_progress").exists()
        assert assignments.filter(project=self.project2, status="pending").exists()

    def test_batch_enrollment_creates_assignments_per_learner(self):
        learner1 = UserFactory()
        learner2 = UserFactory()
        response = self.auth(self.organizer).post(
            self.url, {"emails": [learner1.email, learner2.email]}, format="json"
        )
        assert response.status_code == 201

        for learner in (learner1, learner2):
            enrollment = Enrollment.objects.get(user=learner, cohort=self.cohort)
            assert ProjectAssignment.objects.filter(enrollment=enrollment).count() == 2

    def test_auto_assign_failure_does_not_kill_batch(self):
        """Si l'auto-assign échoue pour un learner, l'inscription doit quand même exister."""
        learner = UserFactory()
        with self.mock_valuations_error():
            response = self.auth(self.organizer).post(
                self.url, {"emails": [learner.email]}, format="json"
            )
        assert response.status_code == 201
        assert Enrollment.objects.filter(user=learner, cohort=self.cohort).exists()

    class mock_valuations_error:
        def __enter__(self):
            from unittest.mock import patch
            self.patcher = patch(
                "apps.evaluations.services.create_assignments_for_enrollment",
                side_effect=Exception("DB error"),
            )
            self.patcher.start()
            return self

        def __exit__(self, *args):
            self.patcher.stop()


# ─────────────────────────────────────────────
# Review sur assignment déjà VALIDATED
# ─────────────────────────────────────────────


class DoubleReviewTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()
        self.cohort = CohortFactory()
        TrainerAssignmentFactory(user=self.trainer, cohort=self.cohort)
        self.enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        self.assignment = ProjectAssignmentFactory(
            enrollment=self.enrollment,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        )
        self.deliverable = DeliverableFactory(
            assignment=self.assignment,
            status=Deliverable.StatusEnum.SUBMITTED,
        )

    def test_cannot_review_deliverable_on_validated_assignment(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {"status": "validated", "score": 80, "feedback": "Trop tard."}
        response = self.auth(self.trainer).post(url, data, format="json")
        assert response.status_code == 400

    def test_cannot_review_already_reviewed_deliverable(self):
        self.deliverable.status = Deliverable.StatusEnum.VALIDATED
        self.deliverable.save(update_fields=["status"])
        self.assignment.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        self.assignment.save(update_fields=["status"])

        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {"status": "rejected", "score": 0, "feedback": "Annulé."}
        response = self.auth(self.trainer).post(url, data, format="json")
        assert response.status_code == 400


# ─────────────────────────────────────────────
# Soumission sur inscription inactive
# ─────────────────────────────────────────────


class InactiveEnrollmentSubmitTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.learner = UserFactory()
        self.enrollment = EnrollmentFactory(user=self.learner)
        self.assignment = ProjectAssignmentFactory(
            enrollment=self.enrollment,
            status=ProjectAssignment.StatusEnum.IN_PROGRESS,
        )
        self.url = f"{ASSIGNMENTS_URL}{self.assignment.id}/deliverables/submit/"

    def test_cannot_submit_on_dropped_enrollment(self):
        self.enrollment.status = Enrollment.StatusEnum.DROPPED
        self.enrollment.save(update_fields=["status"])
        response = self.auth(self.learner).post(
            self.url, {"comments": "Test"}, format="json"
        )
        assert response.status_code == 400

    def test_cannot_submit_on_suspended_enrollment(self):
        self.enrollment.status = Enrollment.StatusEnum.SUSPENDED
        self.enrollment.save(update_fields=["status"])
        response = self.auth(self.learner).post(
            self.url, {"comments": "Test"}, format="json"
        )
        assert response.status_code == 400

    def test_can_submit_on_active_enrollment(self):
        response = self.auth(self.learner).post(
            self.url, {"comments": "OK"}, format="json"
        )
        assert response.status_code == 201
