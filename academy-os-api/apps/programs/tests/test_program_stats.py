from decimal import Decimal
from rest_framework import status

from apps.cohorts.models import Cohort, Enrollment
from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import ProjectAssignment
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory


class ProgramStatsAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

        self.program = ProgramFactory(title="Data Engineering")
        self.project1 = ProjectFactory(
            program=self.program, order=1, title="SQL Basics", status=Project.StatusProjectEnum.PUBLISHED
        )
        self.project2 = ProjectFactory(
            program=self.program, order=2, title="Spark ETL", status=Project.StatusProjectEnum.PUBLISHED
        )

        self.cohort1 = CohortFactory(
            program=self.program,
            name="Cohorte Data 1",
            status=Cohort.StatusEnum.ONGOING,
        )
        self.cohort2 = CohortFactory(
            program=self.program,
            name="Cohorte Data 2",
            status=Cohort.StatusEnum.COMPLETED,
        )

        self.enr1 = EnrollmentFactory(cohort=self.cohort1, status=Enrollment.StatusEnum.ACTIVE)
        self.enr2 = EnrollmentFactory(cohort=self.cohort2, status=Enrollment.StatusEnum.COMPLETED)

        # Assignations
        ProjectAssignment.objects.create(
            enrollment=self.enr1,
            project=self.project1,
            status=ProjectAssignment.StatusEnum.VALIDATED,
            final_score=Decimal("17.00"),
        )
        ProjectAssignment.objects.create(
            enrollment=self.enr2,
            project=self.project1,
            status=ProjectAssignment.StatusEnum.VALIDATED,
            final_score=Decimal("19.00"),
        )
        ProjectAssignment.objects.create(
            enrollment=self.enr2,
            project=self.project2,
            status=ProjectAssignment.StatusEnum.VALIDATED,
            final_score=Decimal("18.00"),
        )

    def test_admin_can_get_program_stats(self):
        self.auth(self.admin)
        res = self.client.get(f"/api/v1/programs/{self.program.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["title"], "Data Engineering")
        self.assertEqual(data["total_cohorts"], 2)
        self.assertEqual(data["active_cohorts"], 1)
        self.assertEqual(data["completed_cohorts"], 1)
        self.assertEqual(data["total_projects"], 2)
        self.assertEqual(data["total_learners"], 2)
        self.assertEqual(data["completed_learners"], 1)
        self.assertEqual(data["completion_rate"], 50.0)

        # Cohortes summary
        self.assertEqual(len(data["cohorts_summary"]), 2)

        # Projets stats
        self.assertEqual(len(data["projects_stats"]), 2)
        p1 = next(p for p in data["projects_stats"] if p["project_id"] == str(self.project1.id))
        self.assertEqual(p1["validated_count"], 2)
        self.assertEqual(p1["validation_rate"], 100.0)

    def test_organizer_can_get_program_stats(self):
        self.auth(self.organizer)
        res = self.client.get(f"/api/v1/programs/{self.program.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_trainer_forbidden_program_stats(self):
        self.auth(self.trainer)
        res = self.client.get(f"/api/v1/programs/{self.program.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_forbidden_program_stats(self):
        self.auth(self.learner)
        res = self.client.get(f"/api/v1/programs/{self.program.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_program_stats_unauthorized(self):
        res = self.client.get(f"/api/v1/programs/{self.program.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
