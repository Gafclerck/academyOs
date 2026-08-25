import factory

from apps.core.tests.factories import UserFactory
from apps.notifications.models import Notification


class NotificationFactory(factory.django.DjangoModelFactory):
    """Factory de test pour Notification."""

    class Meta:
        model = Notification

    recipient = factory.SubFactory(UserFactory)
    notification_type = Notification.TypeEnum.CLAIM_CREATED
    title = factory.LazyAttribute(lambda _: "Test notification")
    message = factory.LazyAttribute(lambda _: "Contenu de test")

    @factory.post_generation
    def content_object(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted is not None:
            from django.contrib.contenttypes.models import ContentType

            self.content_type = ContentType.objects.get_for_model(extracted)
            self.object_id = extracted.pk
            self.save(update_fields=["content_type", "object_id"])
