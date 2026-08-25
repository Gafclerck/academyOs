"""Services du module notifications : création, lecture, marquage lu/non-lu."""

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from apps.users.models import User

from .models import Notification


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
    content_type = None
    object_id = None
    if content_object is not None:
        content_type = ContentType.objects.get_for_model(content_object)
        object_id = content_object.pk

    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        content_type=content_type,
        object_id=object_id,
    )


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
    ).update(is_read=True, read_at=now)
    return updated


def get_unread_count(user):
    """Retourne le nombre de notifications non lues d'un utilisateur."""
    return Notification.objects.filter(recipient=user, is_read=False).count()
