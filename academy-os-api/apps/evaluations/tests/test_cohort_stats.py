from decimal import Decimal
from rest_framework import status

from apps.cohorts.tests.factories import (
    CohortFactory,
    EnrollmentFactory,
    TrainerAssignmentFactory,
)
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import CriterionScore, Evaluation, EvaluationCriterion
from apps.programs.tests.factories import ProgramFactory
from apps.projects.tests.factories import ProjectFactory


class CohortStatsAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

        # Programme avec 2 projets
        self.program = ProgramFactory()
        self.project1 = ProjectFactory(program=self.program, order=1, title="Projet 1")
        self.project2 = ProjectFactory(program=self.program, order=2, title="Projet 2")

        # Critères pour les compétences
        self.crit1 = EvaluationCriterion.objects.create(
            project=self.project1,
            title="Backend logic",
            competency_name="Backend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=1,
        )

        # Cohorte
        self.cohort = CohortFactory(program=self.program, name="Cohorte Dev")

        # Affectation formateur
        self.assignment = TrainerAssignmentFactory(cohort=self.cohort, user=self.trainer)

        # Inscriptions apprenants (2 apprenants)
        self.learner1 = UserFactory()
        self.learner2 = UserFactory()
        self.enr1 = EnrollmentFactory(cohort=self.cohort, user=self.learner1, mentor=self.assignment)
        self.enr2 = EnrollmentFactory(cohort=self.cohort, user=self.learner2)

        # Évaluations :
        # Learner 1 a validé Projet 1 (18/20) et Projet 2 (16/20) -> 100% progress
        eval1 = Evaluation.objects.create(
            enrollment=self.enr1,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
            score=Decimal("18.00"),
        )
        CriterionScore.objects.create(
            evaluation=eval1,
            criterion=self.crit1,
            score=Decimal("18.00"),
            level=CriterionScore.LevelEnum.MASTERED,
        )

        Evaluation.objects.create(
            enrollment=self.enr1,
            project=self.project2,
            status=Evaluation.StatusEnum.VALIDATED,
            score=Decimal("16.00"),
        )

        # Learner 2 a rejeté Projet 1 (8/20), Projet 2 pas encore fait -> 0% progress
        eval2 = Evaluation.objects.create(
            enrollment=self.enr2,
            project=self.project1,
            status=Evaluation.StatusEnum.REJECTED,
            score=Decimal("8.00"),
        )
        CriterionScore.objects.create(
            evaluation=eval2,
            criterion=self.crit1,
            score=Decimal("8.00"),
            level=CriterionScore.LevelEnum.NOT_ACQUIRED,
        )

    def test_get_cohort_stats_admin_success(self):
        self.auth(self.admin)
        res = self.client.get(f"/api/v1/cohorts/{self.cohort.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["cohort_name"], "Cohorte Dev")
        self.assertEqual(data["total_learners"], 2)
        self.assertEqual(data["total_projects"], 2)
        self.assertEqual(data["assigned_mentors_count"], 1)
        self.assertEqual(data["unassigned_mentors_count"], 1)

        # Learner 1 a validé 2/2 (100%), Learner 2 a validé 0/2 (0%) -> moyenne 50%
        self.assertEqual(data["average_progress"], 50.0)

        # Total 3 évaluations, 2 validées -> taux de validation = 2/3 = 66.67%
        self.assertEqual(data["validation_rate"], 66.67)

        # Completion rate : 1 sur 2 a validé 100% des projets -> 50%
        self.assertEqual(data["completion_rate"], 50.0)

        # Projets stats
        self.assertEqual(len(data["projects_stats"]), 2)
        p1_stat = next(p for p in data["projects_stats"] if p["project_id"] == str(self.project1.id))
        self.assertEqual(p1_stat["validated_count"], 1)
        self.assertEqual(p1_stat["revision_count"], 1)
        # Moyenne P1 = (18 + 8) / 2 = 13.0
        self.assertEqual(p1_stat["average_score"], 13.0)

        # Compétences stats
        self.assertTrue(len(data["competency_stats"]) >= 1)
        comp = data["competency_stats"][0]
        self.assertEqual(comp["competency_name"], "Backend")
        self.assertEqual(comp["mastered_count"], 1)
        self.assertEqual(comp["not_acquired_count"], 1)

        # Progression individuelle
        self.assertEqual(len(data["learners_progress"]), 2)

    def test_get_cohort_stats_assigned_trainer_success(self):
        self.auth(self.trainer)
        res = self.client.get(f"/api/v1/cohorts/{self.cohort.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_get_cohort_stats_unassigned_trainer_forbidden(self):
        self.auth(self.other_trainer)
        res = self.client.get(f"/api/v1/cohorts/{self.cohort.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_cohort_stats_learner_forbidden(self):
        self.auth(self.learner)
        res = self.client.get(f"/api/v1/cohorts/{self.cohort.id}/stats/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
