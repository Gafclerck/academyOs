import factory

from apps.certificates.tests import CertificateFactory
from apps.claims.models import Claim
from apps.core.tests.factories import UserFactory


class ClaimFactory(factory.django.DjangoModelFactory):
    """Factory de test pour Claim."""

    class Meta:
        model = Claim

    certificate = factory.SubFactory(CertificateFactory)
    learner = factory.SubFactory(UserFactory)
    message = factory.LazyAttribute(lambda _: "Mon certificat n'a pas été envoyé.")
    status = Claim.StatusEnum.PENDING
