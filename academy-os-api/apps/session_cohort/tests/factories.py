"""Factories factory_boy pour les tests de apps.session_cohort."""

from datetime import date, timedelta

import factory

from apps.session_cohort.models import Session


class SessionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Session

    start_date = factory.Sequence(lambda n: date(2026, 1, 1) + timedelta(days=n))
    end_date = factory.LazyAttribute(lambda o: o.start_date + timedelta(days=30))
    status = Session.StatusEnum.A_VENIR