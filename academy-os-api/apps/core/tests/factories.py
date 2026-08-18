"""Factories factory_boy communes aux tests de toutes les apps."""

import factory
from django.utils import timezone

from apps.users.models import PasswordResetToken, User
from apps.users.services import _hash_code

TEST_PASSWORD = "TestPass123!"
RESET_CODE = "123456"


class UserFactory(factory.django.DjangoModelFactory):
    """Utilisateur actif avec mot de passe utilisable (TEST_PASSWORD)."""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.fr")
    password = factory.PostGenerationMethodCall("set_password", TEST_PASSWORD)
    role = User.Role.LEARNER
    status = User.Status.ACTIVE
    first_name = ""
    last_name = ""
    phone_number = None

    class Params:
        admin = factory.Trait(role=User.Role.ADMIN)
        organizer = factory.Trait(role=User.Role.ORGANIZER)
        trainer = factory.Trait(role=User.Role.TRAINER)
        pending = factory.Trait(status=User.Status.PENDING)
        suspended = factory.Trait(status=User.Status.SUSPENDED)
        archived = factory.Trait(status=User.Status.ARCHIVED)


class PasswordResetTokenFactory(factory.django.DjangoModelFactory):
    """Token valide dont le code en clair est RESET_CODE."""

    class Meta:
        model = PasswordResetToken

    user = factory.SubFactory(UserFactory)
    token = factory.LazyAttribute(lambda o: _hash_code(RESET_CODE))
    expires_at = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(minutes=30))
    used = False