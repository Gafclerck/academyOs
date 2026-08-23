from decimal import Decimal
from rest_framework import status

from apps.certificates.models import Certificate
from apps.cohorts.models import Cohort, Enrollment
from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import Deliverable, ProjectAssignment
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory


class DashboardStatsAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

        # Données de test
        self.program = ProgramFactory()
        self.project = ProjectFactory(program=self.program, status=Project.StatusProjectEnum.PUBLISHED)

        self.cohort_active = CohortFactory(
            program=self.program,
            status=Cohort.StatusEnum.ONGOING,
        )
        self.cohort_upcoming = CohortFactory(
            program=self.program,
            status=Cohort.StatusEnum.UPCOMING,
        )

        self.enr1 = EnrollmentFactory(cohort=self.cohort_active, status=Enrollment.StatusEnum.ACTIVE)
        self.enr2 = EnrollmentFactory(cohort=self.cohort_active, status=Enrollment.StatusEnum.COMPLETED)

        # Certificat
        Certificate.objects.create(
            inscription=self.enr2,
            status=Certificate.StatusCertificateEnum.SENT,
        )

        # Assignations & Livrables
        a1 = ProjectAssignment.objects.create(
            enrollment=self.enr1,
            project=self.project,
            status=ProjectAssignment.StatusEnum.VALIDATED,
            final_score=Decimal("18.00"),
        )
        Deliverable.objects.create(
            assignment=a1,
            version=1,
            submitted_by=self.enr1.user,
            status=Deliverable.StatusEnum.VALIDATED,
            score=Decimal("18.00"),
            reviewed_by=self.trainer,
        )

        a2 = ProjectAssignment.objects.create(
            enrollment=self.enr2,
            project=self.project,
            status=ProjectAssignment.StatusEnum.IN_PROGRESS,
            final_score=None,
        )
        Deliverable.objects.create(
            assignment=a2,
            version=1,
            submitted_by=self.enr2.user,
            status=Deliverable.StatusEnum.REJECTED,
            score=Decimal("8.00"),
            reviewed_by=self.trainer,
        )

    def test_admin_get_dashboard_stats_success(self):
        self.auth(self.admin)
        res = self.client.get("/api/v1/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["active_cohorts"], 1)
        self.assertEqual(data["total_cohorts"], 2)
        self.assertEqual(data["total_projects"], 1)
        self.assertEqual(data["total_evaluations"], 2)
        self.assertEqual(data["total_validated_evaluations"], 1)
        self.assertEqual(data["total_rejected_evaluations"], 1)
        self.assertEqual(data["issued_certificates"], 1)
        self.assertEqual(data["global_validation_rate"], 50.0)
        self.assertEqual(data["average_score"], 18.0)

        # Vérification des distributions
        self.assertIn("cohorts_by_status", data)
        self.assertEqual(data["cohorts_by_status"]["ongoing"], 1)
        self.assertIn("enrollments_by_status", data)
        self.assertIn("evaluations_by_status", data)
        self.assertIn("recent_evaluations", data)
        self.assertTrue(len(data["recent_evaluations"]) >= 1)

    def test_organizer_get_dashboard_stats_success(self):
        self.auth(self.organizer)
        res = self.client.get("/api/v1/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_trainer_forbidden_dashboard_stats(self):
        self.auth(self.trainer)
        res = self.client.get("/api/v1/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_forbidden_dashboard_stats(self):
        self.auth(self.learner)
        res = self.client.get("/api/v1/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_dashboard_stats(self):
        res = self.client.get("/api/v1/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
