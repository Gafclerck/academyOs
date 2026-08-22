from decimal import Decimal
import factory
from django.utils import timezone

from apps.cohorts.tests.factories import EnrollmentFactory
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import CriterionScore, Evaluation, EvaluationCriterion
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


class EvaluationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Evaluation

    enrollment = factory.SubFactory(EnrollmentFactory)
    project = factory.LazyAttribute(lambda o: o.enrollment.cohort.program.projects.first() or ProjectFactory(program=o.enrollment.cohort.program))
    evaluated_by = factory.SubFactory(UserFactory, trainer=True)
    status = Evaluation.StatusEnum.VALIDATED
    score = Decimal("16.00")
    general_feedback = "Bon travail général sur le projet."
    evaluated_at = factory.LazyFunction(timezone.now)


class CriterionScoreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CriterionScore

    evaluation = factory.SubFactory(EvaluationFactory)
    criterion = factory.SubFactory(EvaluationCriterionFactory)
    score = Decimal("16.00")
    level = CriterionScore.LevelEnum.ACQUIRED
    feedback = "Compétence acquise."
