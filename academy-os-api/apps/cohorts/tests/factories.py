"""Factories factory_boy pour les tests de apps.cohorts."""

from datetime import date, timedelta

import factory

from apps.cohorts.models import TrainingPeriod


class TrainingPeriodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TrainingPeriod

    start_date = factory.Sequence(lambda n: date(2026, 1, 1) + timedelta(days=n))
    end_date = factory.LazyAttribute(lambda o: o.start_date + timedelta(days=30))
    status = TrainingPeriod.StatusEnum.UPCOMING