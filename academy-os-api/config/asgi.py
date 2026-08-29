"""
ASGI config for config project.

Expose le callable ASGI au niveau du module, nommé ``application``.

Le serveur sert à la fois HTTP (Django) et WebSockets (Channels).
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

django_asgi_app = get_asgi_application()

from apps.notifications.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': URLRouter(websocket_urlpatterns),
})