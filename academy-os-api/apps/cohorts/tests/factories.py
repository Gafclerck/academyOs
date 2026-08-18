"""Factories factory_boy pour les tests de apps.cohorts."""

from datetime import date, timedelta

import factory

from apps.cohorts.models import Cohort, Enrollment, Intake, TrainerAssignment
from apps.core.tests.factories import UserFactory
from apps.programs.tests.factories import ProgramFactory


class IntakeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Intake

    name = factory.Sequence(lambda n: f"Intake {n}")
    start_date = factory.Sequence(lambda n: date(2026, 1, 1) + timedelta(days=n))
    status = Intake.StatusEnum.UPCOMING


class CohortFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cohort

    name = factory.Sequence(lambda n: f"Cohort {n}")
    description = ""
    program = factory.SubFactory(ProgramFactory)
    intake = factory.SubFactory(IntakeFactory)
    start_date = factory.LazyAttribute(lambda o: o.intake.start_date)
    end_date = factory.LazyAttribute(lambda o: o.start_date + timedelta(days=30))
    status = Cohort.StatusEnum.UPCOMING


class EnrollmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Enrollment

    user = factory.SubFactory(UserFactory)
    cohort = factory.SubFactory(CohortFactory)
    status = Enrollment.StatusEnum.ACTIVE


class TrainerAssignmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TrainerAssignment

    user = factory.SubFactory(UserFactory, trainer=True)
    cohort = factory.SubFactory(CohortFactory)
    status = TrainerAssignment.StatusEnum.ACTIVE