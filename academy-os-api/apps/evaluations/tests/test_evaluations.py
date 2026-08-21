from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from rest_framework import status

from apps.attachments.models import Attachment
from apps.cohorts.models import Enrollment
from apps.cohorts.tests.factories import (
    CohortFactory,
    EnrollmentFactory,
    TrainerAssignmentFactory,
)
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)
from apps.evaluations.services import (
    create_assignments_for_enrollment,
    create_assignments_for_project,
)
from apps.evaluations.tests.factories import (
    DeliverableFactory,
    EvaluationCriterionFactory,
    ProjectAssignmentFactory,
)
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory

ASSIGNMENTS_URL = "/api/v1/assignments/"
DELIVERABLES_URL = "/api/v1/deliverables/"


# ─────────────────────────────────────────────────────────────────────────────
# Tests Assignations de Projet
# ─────────────────────────────────────────────────────────────────────────────

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
        self.assertEqual(response.status_code, 201)
        self.assertEqual(str(response.data["enrollment"]), str(self.enrollment1.id))
        self.assertEqual(str(response.data["project"]), str(self.project.id))
        self.assertEqual(response.data["status"], "pending")

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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(assign1.id))

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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(a1.id))

    def test_program_mismatch_rejected(self):
        other_program = ProgramFactory()
        wrong_project = ProjectFactory(program=other_program)
        data = {
            "enrollment": str(self.enrollment1.id),
            "project": str(wrong_project.id),
        }
        response = self.auth(self.admin).post(ASSIGNMENTS_URL, data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("project", response.data)


# ─────────────────────────────────────────────────────────────────────────────
# Tests Soumission de Livrables
# ─────────────────────────────────────────────────────────────────────────────

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
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["version"], 1)
        self.assertEqual(response.data["status"], "submitted")
        self.assertEqual(response.data["repo_url"], data["repo_url"])

        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, ProjectAssignment.StatusEnum.SUBMITTED)

    def test_resubmission_after_rejection_increments_version(self):
        url = self._submit_url()
        r1 = self.auth(self.learner).post(url, {"comments": "V1"}, format="json")
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r1.data["version"], 1)

        self._reject_as_admin()

        r2 = self.auth(self.learner).post(url, {"comments": "V2 corrigée"}, format="json")
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r2.data["version"], 2)
        self.assertEqual(self.assignment.deliverables.count(), 2)

    def test_cannot_submit_while_already_submitted(self):
        url = self._submit_url()
        self.auth(self.learner).post(url, {"comments": "V1"}, format="json")
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, ProjectAssignment.StatusEnum.SUBMITTED)

        response = self.auth(self.learner).post(url, {"comments": "V2"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_submit_with_attachment_file(self):
        url = self._submit_url()
        file = SimpleUploadedFile("rapport.pdf", b"%PDF-1.4 content", content_type="application/pdf")
        data = {
            "comments": "Rapport avec PDF joint",
            "file": file,
        }
        response = self.auth(self.learner).post(url, data, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data["attachments"]), 1)
        self.assertEqual(response.data["attachments"][0]["original_filename"], "rapport.pdf")

    def test_other_learner_cannot_submit(self):
        url = self._submit_url()
        response = self.auth(self.other_learner).post(url, {"comments": "Hacking"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_submit(self):
        url = self._submit_url()
        response = self.client.post(url, {"comments": "No auth"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_cannot_submit_on_validated_assignment(self):
        self.assignment.status = ProjectAssignment.StatusEnum.VALIDATED
        self.assignment.save(update_fields=["status"])
        url = self._submit_url()
        response = self.auth(self.learner).post(url, {"comments": "Tardif"}, format="json")
        self.assertEqual(response.status_code, 400)


# ─────────────────────────────────────────────────────────────────────────────
# Tests Correction et Grille Critériée
# ─────────────────────────────────────────────────────────────────────────────

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
        self.project = ProjectFactory(program=self.cohort.program, status=Project.StatusProjectEnum.PUBLISHED)
        self.assignment = ProjectAssignmentFactory(enrollment=self.enrollment, project=self.project)
        self.deliverable = DeliverableFactory(assignment=self.assignment)

        # Critères d'évaluation
        self.crit1 = EvaluationCriterionFactory(
            project=self.project,
            title="Backend logic",
            competency_name="Backend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=1,
        )
        self.crit2 = EvaluationCriterionFactory(
            project=self.project,
            title="Frontend UI",
            competency_name="Frontend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=2,
        )

    def test_trainer_can_review_and_validate_deliverable_with_score(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "validated",
            "score": "18.50",
            "feedback": "Excellent travail, architecture propre et code documenté.",
        }
        response = self.auth(self.trainer).post(url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "validated")
        self.assertEqual(float(response.data["score"]), 18.50)
        self.assertEqual(response.data["feedback"], data["feedback"])
        self.assertEqual(str(response.data["reviewed_by"]), str(self.trainer.id))

        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, ProjectAssignment.StatusEnum.VALIDATED)
        self.assertEqual(self.assignment.final_score, Decimal("18.50"))

    def test_trainer_can_review_with_criteria_grid(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "validated",
            "feedback": "Evaluation détaillée par critères.",
            "criterion_scores": [
                {
                    "criterion": str(self.crit1.id),
                    "score": "18.00",
                    "level": "mastered",
                    "feedback": "Architecture solide",
                },
                {
                    "criterion": str(self.crit2.id),
                    "score": "14.00",
                    "level": "acquired",
                    "feedback": "UI fonctionnelle",
                },
            ],
        }
        response = self.auth(self.trainer).post(url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "validated")
        # Moyenne pondérée (18 + 14) / 2 = 16.00
        self.assertEqual(float(response.data["score"]), 16.00)
        self.assertEqual(len(response.data["criterion_scores"]), 2)

        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, ProjectAssignment.StatusEnum.VALIDATED)
        self.assertEqual(self.assignment.final_score, Decimal("16.00"))

    def test_trainer_can_review_and_reject_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "rejected",
            "score": "8.00",
            "feedback": "Des erreurs bloquantes sur les tests. À retravailler.",
        }
        response = self.auth(self.trainer).post(url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "rejected")

        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, ProjectAssignment.StatusEnum.IN_PROGRESS)
        self.assertIsNone(self.assignment.final_score)

    def test_learner_cannot_review_deliverable(self):
        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {
            "status": "validated",
            "score": "20.00",
            "feedback": "Auto-validation interdite.",
        }
        response = self.auth(self.learner).post(url, data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_validation_advances_next_assignment(self):
        project2 = ProjectFactory(
            program=self.cohort.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order=2,
        )
        self.project.order = 1
        self.project.save(update_fields=["order"])

        next_assignment = ProjectAssignmentFactory(
            enrollment=self.enrollment,
            project=project2,
            status=ProjectAssignment.StatusEnum.PENDING,
        )

        url = f"{DELIVERABLES_URL}{self.deliverable.id}/review/"
        data = {"status": "validated", "score": "17.00", "feedback": "Bien."}
        self.auth(self.trainer).post(url, data, format="json")

        next_assignment.refresh_from_db()
        self.assertEqual(next_assignment.status, ProjectAssignment.StatusEnum.IN_PROGRESS)

    def test_deleting_deliverable_purges_attachments_cascade(self):
        file = SimpleUploadedFile("archive.zip", b"PK...", content_type="application/zip")
        submit_url = f"{ASSIGNMENTS_URL}{self.assignment.id}/deliverables/submit/"
        resp = self.auth(self.learner).post(
            submit_url,
            {"comments": "Avec zip", "file": file},
            format="multipart",
        )
        deliv_id = resp.data["id"]
        self.assertEqual(Attachment.objects.filter(object_id=deliv_id).count(), 1)

        Deliverable.objects.filter(id=deliv_id).delete()
        self.assertEqual(Attachment.objects.filter(object_id=deliv_id).count(), 0)


# ─────────────────────────────────────────────────────────────────────────────
# Tests Auto-Assignation
# ─────────────────────────────────────────────────────────────────────────────

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
        self.assertEqual(assignments.count(), 2)
        self.assertEqual(
            set(assignments.values_list("project_id", flat=True)),
            {self.project1.id, self.project2.id},
        )

    def test_first_project_starts_in_progress(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        a1 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project1)
        self.assertEqual(a1.status, ProjectAssignment.StatusEnum.IN_PROGRESS)

    def test_subsequent_project_starts_pending(self):
        enrollment = EnrollmentFactory(user=self.learner, cohort=self.cohort)
        create_assignments_for_enrollment(enrollment)

        a2 = ProjectAssignment.objects.get(enrollment=enrollment, project=self.project2)
        self.assertEqual(a2.status, ProjectAssignment.StatusEnum.PENDING)
