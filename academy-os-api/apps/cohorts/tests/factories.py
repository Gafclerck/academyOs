"""Factories factory_boy pour les tests de apps.cohorts."""

from datetime import date, timedelta

import factory

from apps.cohorts.models import Cohort, Intake
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