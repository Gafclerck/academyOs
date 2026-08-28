from decimal import Decimal
from rest_framework import status

from apps.certificates.models import Certificate
from apps.cohorts.models import Cohort, Enrollment
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
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory


class DashboardEndpointsAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()
        self.other_learner = UserFactory()

        # Programme & Projets
        self.program = ProgramFactory(title="Web Dev")
        self.project1 = ProjectFactory(
            program=self.program, order=1, title="HTML CSS", status=Project.StatusProjectEnum.PUBLISHED
        )
        self.project2 = ProjectFactory(
            program=self.program, order=2, title="JavaScript", status=Project.StatusProjectEnum.PUBLISHED
        )

        # Critères
        self.criterion = EvaluationCriterion.objects.create(
            project=self.project1,
            title="Design responsive",
            competency_name="Frontend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=1,
        )

        # Cohorte
        self.cohort = CohortFactory(
            program=self.program,
            name="Cohorte 2026",
            status=Cohort.StatusEnum.ONGOING,
        )

        # Affectation formateur
        self.trainer_assignment = TrainerAssignmentFactory(
            cohort=self.cohort,
            user=self.trainer,
        )

        # Inscription apprenant avec mentor
        self.enrollment = EnrollmentFactory(
            cohort=self.cohort,
            user=self.learner,
            mentor=self.trainer_assignment,
            status=Enrollment.StatusEnum.ACTIVE,
        )

        # Assignations
        self.assignment1 = ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.project1,
            status=ProjectAssignment.StatusEnum.VALIDATED,
            final_score=Decimal("19.00"),
        )
        self.deliverable1 = Deliverable.objects.create(
            assignment=self.assignment1,
            version=1,
            submitted_by=self.learner,
            status=Deliverable.StatusEnum.VALIDATED,
            score=Decimal("19.00"),
            feedback="Excellent travail",
            reviewed_by=self.trainer,
        )
        CriterionScore.objects.create(
            deliverable=self.deliverable1,
            criterion=self.criterion,
            score=Decimal("19.00"),
            level=CriterionScore.LevelEnum.MASTERED,
        )

        self.assignment2 = ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.project2,
            status=ProjectAssignment.StatusEnum.SUBMITTED,
        )
        self.deliverable2 = Deliverable.objects.create(
            assignment=self.assignment2,
            version=1,
            submitted_by=self.learner,
            status=Deliverable.StatusEnum.SUBMITTED,
            repo_url="https://github.com/test/js-project",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 1. TEST DASHBOARD APPRENANT
    # ─────────────────────────────────────────────────────────────────────────
    def test_learner_dashboard_success(self):
        self.auth(self.learner)
        res = self.client.get("/api/v1/dashboard/learner/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertTrue(data["has_enrollment"])
        self.assertEqual(data["cohort_name"], "Cohorte 2026")
        self.assertEqual(data["program_name"], "Web Dev")
        self.assertEqual(data["total_projects"], 2)
        self.assertEqual(data["validated_projects"], 1)
        self.assertEqual(data["progress_percentage"], 50.0)
        self.assertEqual(data["average_score"], 19.0)

        # Mentor
        self.assertIsNotNone(data["mentor_name"])
        self.assertEqual(data["mentor_email"], self.trainer.email)

        # Projet courant (le deuxième soumis)
        self.assertIsNotNone(data["current_project"])
        self.assertEqual(data["current_project"]["title"], "JavaScript")
        self.assertEqual(data["current_project"]["status"], "submitted")

        # Livrables récents
        self.assertEqual(len(data["recent_deliverables"]), 2)

        # Compétences
        self.assertTrue(len(data["competency_scores"]) >= 1)
        self.assertEqual(data["competency_scores"][0]["competency_name"], "Frontend")
        self.assertEqual(data["competency_scores"][0]["latest_level"], "mastered")

    def test_learner_dashboard_no_enrollment(self):
        self.auth(self.other_learner)
        res = self.client.get("/api/v1/dashboard/learner/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["has_enrollment"])
        self.assertEqual(res.data["total_projects"], 0)

    # ─────────────────────────────────────────────────────────────────────────
    # 2. TEST DASHBOARD FORMATEUR
    # ─────────────────────────────────────────────────────────────────────────
    def test_trainer_dashboard_success(self):
        self.auth(self.trainer)
        res = self.client.get("/api/v1/dashboard/trainer/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["total_assigned_cohorts"], 1)
        self.assertEqual(data["total_students"], 1)
        self.assertEqual(data["direct_mentees_count"], 1)
        self.assertEqual(data["pending_reviews_count"], 1)

        # File de livrables en attente
        self.assertEqual(len(data["pending_reviews"]), 1)
        pending = data["pending_reviews"][0]
        self.assertEqual(pending["project_title"], "JavaScript")
        self.assertEqual(pending["learner_email"], self.learner.email)
        self.assertEqual(pending["repo_url"], "https://github.com/test/js-project")

        # Cohortes summary
        self.assertEqual(len(data["cohorts_summary"]), 1)
        self.assertEqual(data["cohorts_summary"][0]["cohort_name"], "Cohorte 2026")

        # Dernières corrections
        self.assertEqual(len(data["recent_reviews"]), 1)
        self.assertEqual(data["recent_reviews"][0]["score"], 19.0)

    def test_admin_can_view_specific_trainer_dashboard(self):
        self.auth(self.admin)
        res = self.client.get(f"/api/v1/dashboard/trainer/?trainer={self.trainer.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_assigned_cohorts"], 1)

    def test_trainer_cannot_view_other_trainer_dashboard(self):
        self.auth(self.trainer)
        res = self.client.get(f"/api/v1/dashboard/trainer/?trainer={self.other_trainer.id}")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_trainer_dashboard_forbidden_for_learner(self):
        self.auth(self.learner)
        res = self.client.get("/api/v1/dashboard/trainer/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. TEST FICHE PROGRESSION DÉTAILLÉE APPRENANT
    # ─────────────────────────────────────────────────────────────────────────
    def test_enrollment_progress_admin_success(self):
        self.auth(self.admin)
        res = self.client.get(f"/api/v1/enrollments/{self.enrollment.id}/progress/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["user_email"], self.learner.email)
        self.assertEqual(data["cohort_name"], "Cohorte 2026")
        self.assertEqual(data["progress_percentage"], 50.0)
        self.assertEqual(len(data["assignments"]), 2)
        self.assertEqual(len(data["competency_stats"]), 1)

    def test_enrollment_progress_assigned_trainer_success(self):
        self.auth(self.trainer)
        res = self.client.get(f"/api/v1/enrollments/{self.enrollment.id}/progress/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_enrollment_progress_own_learner_success(self):
        self.auth(self.learner)
        res = self.client.get(f"/api/v1/enrollments/{self.enrollment.id}/progress/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_enrollment_progress_unassigned_trainer_forbidden(self):
        self.auth(self.other_trainer)
        res = self.client.get(f"/api/v1/enrollments/{self.enrollment.id}/progress/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_enrollment_progress_other_learner_forbidden(self):
        self.auth(self.other_learner)
        res = self.client.get(f"/api/v1/enrollments/{self.enrollment.id}/progress/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ─────────────────────────────────────────────────────────────────────────
    # 4. TEST ROOT DELIVERABLES LIST (FILE DE CORRECTION)
    # ─────────────────────────────────────────────────────────────────────────
    def test_deliverables_root_list_trainer_filter_submitted(self):
        self.auth(self.trainer)
        res = self.client.get("/api/v1/deliverables/?status=submitted")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["id"], str(self.deliverable2.id))

    def test_deliverables_root_list_learner_only_own(self):
        self.auth(self.learner)
        res = self.client.get("/api/v1/deliverables/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)

    def test_deliverables_root_list_ordering(self):
        self.auth(self.admin)
        res = self.client.get("/api/v1/deliverables/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data["results"]) >= 2)
        # Vérifier que le plus récent soumis est en premier
        d0_date = res.data["results"][0]["submitted_at"]
        d1_date = res.data["results"][1]["submitted_at"]
        self.assertTrue(d0_date >= d1_date)

    def test_deliverables_list_includes_submitted_by_name(self):
        self.learner.first_name = "Awa"
        self.learner.last_name = "Diop"
        self.learner.save()
        self.auth(self.admin)
        res = self.client.get("/api/v1/deliverables/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)
        self.assertEqual(res.data["results"][0]["submitted_by_name"], "Awa Diop")

    def test_deliverables_root_list_other_learner_empty(self):
        self.auth(self.other_learner)
        res = self.client.get("/api/v1/deliverables/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 0)

    def test_learner_dashboard_with_cohort_filter(self):
        # Créer une deuxième cohorte et inscription pour le même apprenant
        cohort2 = CohortFactory(program=self.program, name="Cohorte 2027")
        enr2 = EnrollmentFactory(cohort=cohort2, user=self.learner, status=Enrollment.StatusEnum.ACTIVE)

        self.auth(self.learner)
        res = self.client.get(f"/api/v1/dashboard/learner/?cohort={cohort2.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["cohort_id"], str(cohort2.id))
        self.assertEqual(res.data["cohort_name"], "Cohorte 2027")

    def test_learner_dashboard_prioritizes_active_enrollment(self):
        # Créer une inscription plus récente mais completed
        cohort_old = CohortFactory(program=self.program, name="Cohorte Future")
        EnrollmentFactory(cohort=cohort_old, user=self.learner, status=Enrollment.StatusEnum.COMPLETED)

        self.auth(self.learner)
        res = self.client.get("/api/v1/dashboard/learner/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # L'inscription active (Cohorte 2026) doit être priorisée
        self.assertEqual(res.data["cohort_name"], "Cohorte 2026")

    # ─────────────────────────────────────────────────────────────────────────
    # 5. TEST COHORT STATS LEARNERS AT RISK
    # ─────────────────────────────────────────────────────────────────────────
    def test_cohort_stats_includes_learners_at_risk(self):
        # Créer un deuxième apprenant en échec répété
        stalled_learner = UserFactory()
        stalled_enr = EnrollmentFactory(cohort=self.cohort, user=stalled_learner, status=Enrollment.StatusEnum.ACTIVE)
        a = ProjectAssignment.objects.create(
            enrollment=stalled_enr,
            project=self.project1,
            status=ProjectAssignment.StatusEnum.IN_PROGRESS,
        )
        Deliverable.objects.create(
            assignment=a,
            version=1,
            submitted_by=stalled_learner,
            status=Deliverable.StatusEnum.REJECTED,
        )
        Deliverable.objects.create(
            assignment=a,
            version=2,
            submitted_by=stalled_learner,
            status=Deliverable.StatusEnum.REJECTED,
        )

        self.auth(self.admin)
        res = self.client.get(f"/api/v1/cohorts/{self.cohort.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("learners_at_risk", res.data)
        self.assertTrue(res.data["learners_at_risk_count"] >= 1)
        at_risk_emails = [l["email"] for l in res.data["learners_at_risk"]]
        self.assertIn(stalled_learner.email, at_risk_emails)

