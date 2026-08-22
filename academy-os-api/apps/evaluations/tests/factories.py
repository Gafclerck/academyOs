from decimal import Decimal

import factory
from django.utils import timezone

from apps.cohorts.tests.factories import EnrollmentFactory
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)
from apps.projects.tests.factories import ProjectFactory


class EvaluationCriterionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EvaluationCriterion

    project = factory.SubFactory(ProjectFactory)
    title = factory.Sequence(lambda n: f"Critère {n}")
    description = "Description du critère d'évaluation"
    competency_name = "Développement Backend"
    max_score = Decimal("20.00")
    weight = Decimal("1.00")
    order = factory.Sequence(lambda n: n + 1)


class ProjectAssignmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectAssignment

    enrollment = factory.SubFactory(EnrollmentFactory)
    project = factory.SubFactory(ProjectFactory)
    status = ProjectAssignment.StatusEnum.PENDING
    assigned_at = factory.LazyFunction(timezone.now)


class DeliverableFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Deliverable

    assignment = factory.SubFactory(ProjectAssignmentFactory)
    version = 1
    submitted_by = factory.LazyAttribute(lambda o: o.assignment.enrollment.user)
    submitted_at = factory.LazyFunction(timezone.now)
    repo_url = "https://github.com/student/mon-projet"
    live_url = "https://mon-projet.vercel.app"
    comments = "Version initiale du livrable."
    status = Deliverable.StatusEnum.SUBMITTED


class CriterionScoreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CriterionScore

    deliverable = factory.SubFactory(DeliverableFactory)
    criterion = factory.SubFactory(EvaluationCriterionFactory)
    score = Decimal("16.00")
    level = CriterionScore.LevelEnum.ACQUIRED
    feedback = "Compétence acquise."
