from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.cohorts.tests.factories import EnrollmentFactory
from apps.evaluations.models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)
from apps.projects.tests.factories import ProjectFactory


class EvaluationModelTests(TestCase):
    def setUp(self):
        self.project = ProjectFactory()
        self.enrollment = EnrollmentFactory(cohort__program=self.project.program)

    def test_create_evaluation_criterion(self):
        crit = EvaluationCriterion.objects.create(
            project=self.project,
            title="Code Quality",
            description="Respect PEP8",
            competency_name="Backend",
            max_score=Decimal("20.00"),
            weight=Decimal("2.00"),
            order=1,
        )
        self.assertIsNotNone(crit.id)
        self.assertEqual(str(crit), f"{self.project.title} - Code Quality (max: 20.00)")

    def test_criterion_unique_order_per_project(self):
        EvaluationCriterion.objects.create(
            project=self.project,
            title="Crit 1",
            order=1,
        )
        with self.assertRaises(IntegrityError):
            EvaluationCriterion.objects.create(
                project=self.project,
                title="Crit 2",
                order=1,
            )

    def test_create_deliverable_and_calculate_weighted_score(self):
        assignment = ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.project,
            status=ProjectAssignment.StatusEnum.SUBMITTED,
        )
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=self.enrollment.user,
        )

        crit1 = EvaluationCriterion.objects.create(
            project=self.project,
            title="Crit 1",
            max_score=Decimal("20.00"),
            weight=Decimal("1.00"),
            order=1,
        )
        crit2 = EvaluationCriterion.objects.create(
            project=self.project,
            title="Crit 2",
            max_score=Decimal("20.00"),
            weight=Decimal("3.00"),
            order=2,
        )

        CriterionScore.objects.create(
            deliverable=deliverable,
            criterion=crit1,
            score=Decimal("10.00"),
            level=CriterionScore.LevelEnum.IN_PROGRESS,
        )
        CriterionScore.objects.create(
            deliverable=deliverable,
            criterion=crit2,
            score=Decimal("18.00"),
            level=CriterionScore.LevelEnum.MASTERED,
        )

        # Weighted calculation: (10*1 + 18*3) / (1+3) = (10 + 54) / 4 = 64 / 4 = 16.00
        calculated = deliverable.calculate_score()
        self.assertEqual(calculated, Decimal("16.00"))

    def test_unique_assignment_per_enrollment_and_project(self):
        ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.project,
        )
        with self.assertRaises(IntegrityError):
            ProjectAssignment.objects.create(
                enrollment=self.enrollment,
                project=self.project,
            )

    def test_unique_criterion_score_per_deliverable_and_criterion(self):
        assignment = ProjectAssignment.objects.create(
            enrollment=self.enrollment,
            project=self.project,
        )
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=self.enrollment.user,
        )
        crit = EvaluationCriterion.objects.create(
            project=self.project,
            title="Critère A",
            order=1,
        )
        CriterionScore.objects.create(
            deliverable=deliverable,
            criterion=crit,
            score=Decimal("15.00"),
        )
        with self.assertRaises(IntegrityError):
            CriterionScore.objects.create(
                deliverable=deliverable,
                criterion=crit,
                score=Decimal("12.00"),
            )
