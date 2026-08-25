from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture pour une notification."""

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "is_read",
            "read_at",
            "content_type",
            "object_id",
            "created_at",
        ]
        read_only_fields = fields
