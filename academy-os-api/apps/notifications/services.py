"""Services du module notifications : création, lecture, marquage lu/non-lu."""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)

WS_GROUP_PREFIX = "notification_"


def _notification_payload(notification):
    """Payload diffusé via WebSocket.

    Contract unique : la forme est celle de ``NotificationSerializer``
    pour rester aligné avec l'API REST (le front consomme la même shape).
    """
    return NotificationSerializer(notification).data


def _notify_websocket(notification):
    """Diffuse l'événement WS au groupe du destinataire (best-effort).

    Ne doit jamais faire échouer l'écriture en base : l'échec est loggé.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"{WS_GROUP_PREFIX}{notification.recipient_id}",
            {
                "type": "notification.created",
                "data": _notification_payload(notification),
            },
        )
    except Exception:
        logger.warning("Échec d'envoi WebSocket de la notification", exc_info=True)


@transaction.atomic
def create_notification(
    *,
    recipient,
    notification_type,
    title,
    message,
    content_object=None,
):
    """Crée une notification in-app pour un destinataire.

    ``content_object`` est optionnel : s'il est fourni, GenericForeignKey
    est renseignée automatiquement. Retourne l'objet Notification créé.
    """
    created = create_notifications(
        recipients=[recipient],
        notification_type=notification_type,
        title=title,
        message=message,
        content_object=content_object,
    )
    return created[0]


@transaction.atomic
def create_notifications(
    *,
    recipients,
    notification_type,
    title,
    message,
    content_object=None,
):
    """Crée des notifications in-app pour plusieurs destinataires en une seule requête.

    ``content_object`` est optionnel : s'il est fourni, GenericForeignKey
    est renseignée automatiquement pour toutes les lignes. Retourne la liste
    des objets Notification créés.

    La diffusion WebSocket est déclenchée après commit de la transaction :
    aucun événement n'est émis si elle est annulée.
    """
    content_type = None
    object_id = None
    if content_object is not None:
        content_type = ContentType.objects.get_for_model(content_object)
        object_id = content_object.pk

    notifications = [
        Notification(
            recipient=user,
            notification_type=notification_type,
            title=title,
            message=message,
            content_type=content_type,
            object_id=object_id,
        )
        for user in recipients
    ]
    created = Notification.objects.bulk_create(notifications)
    for notification in created:
        transaction.on_commit(
            lambda n=notification: _notify_websocket(n)
        )
    return created


def mark_as_read(notification, user):
    """Marque une notification comme lue. Vérifie la propriété.

    Retourne la notification mise à jour ou lève PermissionDenied.
    """
    from django.core.exceptions import PermissionDenied

    if notification.recipient_id != user.id:
        raise PermissionDenied("Vous ne pouvez pas modifier une notification qui ne vous appartient pas.")

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return notification


@transaction.atomic
def mark_all_as_read(user):
    """Marque toutes les notifications non lues d'un utilisateur comme lues.

    Retourne le nombre de notifications mises à jour.
    """
    now = timezone.now()
    updated = Notification.objects.filter(
        recipient=user,
        is_read=False,
    ).update(is_read=True, read_at=now, updated_at=now)
    return updated


def mark_as_unread(notification, user):
    """Marque une notification comme non lue. Vérifie la propriété.

    Retourne la notification mise à jour ou lève PermissionDenied.
    """
    from django.core.exceptions import PermissionDenied

    if notification.recipient_id != user.id:
        raise PermissionDenied("Vous ne pouvez pas modifier une notification qui ne vous appartient pas.")

    if notification.is_read:
        notification.is_read = False
        notification.read_at = None
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return notification


def get_unread_count(user):
    """Retourne le nombre de notifications non lues d'un utilisateur."""
    return Notification.objects.filter(recipient=user, is_read=False).count()
