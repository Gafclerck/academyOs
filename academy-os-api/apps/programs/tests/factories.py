"""Factories factory_boy pour les tests de apps.programs."""

import factory

from apps.programs.models import Program

class ProgramFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Program

    title = factory.Sequence(lambda n: f"Programme {n}")
    description = ""
    status = Program.StatusProgramEnum.ACTIVE