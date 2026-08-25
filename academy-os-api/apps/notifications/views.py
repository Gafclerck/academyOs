from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdmin

from .models import Notification
from .serializers import NotificationSerializer
from .services import get_unread_count, mark_all_as_read, mark_as_read



# ============== NOTIFICATIONS =======================


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste et détail des notifications de l'utilisateur connecté."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by(
            "-created_at"
        )


class UnreadCountView(APIView):
    """GET /api/v1/notifications/unread-count/ — nombre de notifications non lues."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Nombre de notifications non lues",
        responses={200: {"type": "object", "properties": {"unread_count": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    def get(self, request):
        count = get_unread_count(request.user)
        return Response({"unread_count": count})


class MarkAsReadView(APIView):
    """PATCH /api/v1/notifications/<uuid>/read/ — marquer une notification comme lue."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Marquer une notification comme lue",
        responses={200: NotificationSerializer},
        tags=["Notifications"],
    )
    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
        updated = mark_as_read(notification, request.user)
        return Response(NotificationSerializer(updated).data)


class MarkAllAsReadView(APIView):
    """POST /api/v1/notifications/read-all/ — marquer toutes les notifications comme lues."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Marquer toutes les notifications comme lues",
        responses={200: {"type": "object", "properties": {"updated_count": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    def post(self, request):
        count = mark_all_as_read(request.user)
        return Response({"updated_count": count})
