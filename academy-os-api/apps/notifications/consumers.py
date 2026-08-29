"""Consumer WebSocket : notifications temps réel par utilisateur.

Chaque utilisateur authentifié rejoint le groupe ``notification_<user_id>`` ;
les notifications créées par ``apps.notifications.services`` y sont diffusées.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


def _user_from_token(token):
    """Retourne l'utilisateur correspondant au JWT d'accès, ou None."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        access = AccessToken(token)
    except TokenError:
        return None
    try:
        user = User.objects.get(pk=access["user_id"])
    except User.DoesNotExist:
        return None
    if not user.is_active:
        return None
    return user


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Flux de notifications en temps réel d'un utilisateur connecté.

    Connexion via ``ws://…/ws/notifications/?token=<JWT access>``
    (le navigateur ne permet pas d'envoyer des headers sur un WebSocket).
    """

    group_prefix = "notification_"

    async def connect(self):
        token = self._extract_token()
        if token is None:
            await self.close(code=4401)
            return

        user = await database_sync_to_async(_user_from_token)(token)
        if user is None:
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = f"{self.group_prefix}{user.pk}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})

    async def notification_created(self, event):
        """Méthode appelée par ``group_send`` (type 'notification.created')."""
        await self.send_json({"type": "notification.created", "data": event["data"]})

    def _extract_token(self):
        query_string = self.scope.get("query_string", b"").decode()
        for pair in query_string.split("&"):
            if not pair:
                continue
            key, _, value = pair.partition("=")
            if key == "token" and value:
                return value
        return None