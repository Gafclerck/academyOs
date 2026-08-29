"""Tests WebSocket : authentification du consumer, ping/pong et diffusion."""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.db import transaction
from django.test import TransactionTestCase, override_settings
from rest_framework_simplejwt.tokens import AccessToken
from unittest import mock

from apps.core.tests.factories import UserFactory
from apps.notifications.consumers import NotificationConsumer
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.services import (
    _notification_payload,
    create_notification,
)

INMEMORY_CHANNEL_LAYERS = {
    'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'},
}


@override_settings(CHANNEL_LAYERS=INMEMORY_CHANNEL_LAYERS)
class NotificationConsumerTests(TransactionTestCase):
    """Tests du consumer : connexion (JWT), ping/pong, réception de groupe."""

    def setUp(self):
        self.user = UserFactory()
        self.token = str(AccessToken.for_user(self.user))

    def _communicator(self, token=None):
        path = "/ws/notifications/"
        if token is not None:
            path += f"?token={token}"
        return WebsocketCommunicator(NotificationConsumer.as_asgi(), path)

    async def test_connect_without_token_rejected(self):
        communicator = self._communicator()
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_connect_with_invalid_token_rejected(self):
        communicator = self._communicator(token="invalid-token")
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_connect_with_valid_token_and_ping_pong(self):
        communicator = self._communicator(token=self.token)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "ping"})
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "pong")

        await communicator.disconnect()

    async def test_receives_group_message(self):
        communicator = self._communicator(token=self.token)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"notification_{self.user.pk}",
            {"type": "notification.created", "data": {"id": "x"}},
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "notification.created")
        self.assertEqual(response["data"]["id"], "x")

        await communicator.disconnect()


@override_settings(CHANNEL_LAYERS=INMEMORY_CHANNEL_LAYERS)
class WebSocketPublishTests(TransactionTestCase):
    """La création de notification déclenche une diffusion après commit."""

    @mock.patch("apps.notifications.services._notify_websocket")
    def test_create_notification_publishes_after_commit(self, mock_notify):
        user = UserFactory()
        with transaction.atomic():
            notif = create_notification(
                recipient=user,
                notification_type=Notification.TypeEnum.CLAIM_CREATED,
                title="Titre",
                message="Message",
            )
            mock_notify.assert_not_called()
        mock_notify.assert_called_once_with(notif)


@override_settings(CHANNEL_LAYERS=INMEMORY_CHANNEL_LAYERS)
class WebSocketPayloadTests(TransactionTestCase):
    """Le payload WebSocket reste aligné sur NotificationSerializer."""

    def test_payload_matches_serializer(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Titre",
            message="Message",
        )

        self.assertEqual(
            _notification_payload(notif),
            NotificationSerializer(notif).data,
        )

    def test_payload_contains_read_at(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Titre",
            message="Message",
        )

        self.assertIn("read_at", _notification_payload(notif))