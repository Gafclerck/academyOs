"""Factories factory_boy pour les tests de apps.projects."""

import factory

from apps.programs.tests.factories import ProgramFactory

from ..models import Project


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    program = factory.SubFactory(ProgramFactory)
    title = factory.Sequence(lambda n: f"Projet {n}")
    description = ""
    status = Project.StatusProjectEnum.DRAFT
    order = factory.Sequence(lambda n: n + 1)
