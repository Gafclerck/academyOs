from decimal import Decimal
from rest_framework import status

from apps.cohorts.tests.factories import (
    CohortFactory,
    EnrollmentFactory,
    TrainerAssignmentFactory,
)
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import CriterionScore, Evaluation
from apps.programs.tests.factories import ProgramFactory
from apps.projects.tests.factories import ProjectFactory

from .factories import EvaluationCriterionFactory, EvaluationFactory


class EvaluationAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.program = ProgramFactory()
        self.project1 = ProjectFactory(program=self.program, order=1)
        self.project2 = ProjectFactory(program=self.program, order=2)

        self.cohort = CohortFactory(program=self.program)
        self.other_cohort = CohortFactory(program=self.program)

        self.admin = UserFactory(admin=True)
        self.trainer = UserFactory(trainer=True)
        self.other_trainer = UserFactory(trainer=True)
        self.learner = UserFactory()
        self.other_learner = UserFactory()

        # Affectations
        TrainerAssignmentFactory(cohort=self.cohort, user=self.trainer)
        TrainerAssignmentFactory(cohort=self.other_cohort, user=self.other_trainer)

        # Inscriptions
        self.enrollment = EnrollmentFactory(cohort=self.cohort, user=self.learner)
        self.other_enrollment = EnrollmentFactory(cohort=self.other_cohort, user=self.other_learner)

        # Critères du projet 1
        self.crit1 = EvaluationCriterionFactory(
            project=self.project1,
            title="Backend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=1,
        )
        self.crit2 = EvaluationCriterionFactory(
            project=self.project1,
            title="Frontend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=2,
        )

    def test_trainer_can_grade_assigned_learner(self):
        self.auth(self.trainer)
        payload = {
            "enrollment": str(self.enrollment.id),
            "project": str(self.project1.id),
            "status": "validated",
            "general_feedback": "Très bon travail global.",
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

        res = self.post_json("/api/v1/evaluations/grade/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "validated")
        # Moyenne pondérée (18 + 14) / 2 = 16.00
        self.assertEqual(float(res.data["score"]), 16.00)
        self.assertEqual(len(res.data["criterion_scores"]), 2)

        # Vérification en base
        eval_obj = Evaluation.objects.get(enrollment=self.enrollment, project=self.project1)
        self.assertEqual(eval_obj.evaluated_by, self.trainer)
        self.assertEqual(eval_obj.criterion_scores.count(), 2)

    def test_trainer_cannot_grade_learner_from_another_cohort(self):
        self.auth(self.trainer)
        payload = {
            "enrollment": str(self.other_enrollment.id),
            "project": str(self.project1.id),
            "status": "validated",
        }
        res = self.post_json("/api/v1/evaluations/grade/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_cannot_grade(self):
        self.auth(self.learner)
        payload = {
            "enrollment": str(self.enrollment.id),
            "project": str(self.project1.id),
            "status": "validated",
        }
        res = self.post_json("/api/v1/evaluations/grade/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_grade_project_from_different_program_fails(self):
        other_prog_project = ProjectFactory()  # programme différent
        self.auth(self.trainer)
        payload = {
            "enrollment": str(self.enrollment.id),
            "project": str(other_prog_project.id),
            "status": "validated",
        }
        res = self.post_json("/api/v1/evaluations/grade/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_learner_can_only_view_own_evaluations(self):
        # Création de 2 évaluations
        eval1 = Evaluation.objects.create(
            enrollment=self.enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
            score=Decimal("15.00"),
        )
        eval2 = Evaluation.objects.create(
            enrollment=self.other_enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
            score=Decimal("17.00"),
        )

        self.auth(self.learner)
        res = self.client.get("/api/v1/evaluations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["id"], str(eval1.id))

    def test_trainer_views_evaluations_of_assigned_cohort(self):
        eval1 = Evaluation.objects.create(
            enrollment=self.enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
        )
        Evaluation.objects.create(
            enrollment=self.other_enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
        )

        self.auth(self.trainer)
        res = self.client.get("/api/v1/evaluations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["id"], str(eval1.id))

    def test_admin_can_view_all_evaluations_and_filter(self):
        Evaluation.objects.create(
            enrollment=self.enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.VALIDATED,
        )
        Evaluation.objects.create(
            enrollment=self.other_enrollment,
            project=self.project1,
            status=Evaluation.StatusEnum.REJECTED,
        )

        self.auth(self.admin)
        res = self.client.get("/api/v1/evaluations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)

        # Filtrer par statut
        res_val = self.client.get("/api/v1/evaluations/?status=validated")
        self.assertEqual(res_val.data["count"], 1)
