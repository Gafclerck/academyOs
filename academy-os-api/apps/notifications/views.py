from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer
from .services import get_unread_count, mark_all_as_read, mark_as_read, mark_as_unread


# ============== NOTIFICATIONS =======================


@extend_schema_view(
    list=extend_schema(
        summary="Lister mes notifications",
        description="Liste paginée des notifications de l'utilisateur connecté. "
        "Filtre optionnel 'is_read' = true|false.",
        parameters=[
            OpenApiParameter(
                "is_read",
                str,
                OpenApiParameter.QUERY,
                description="Filtrer par état de lecture ('true' ou 'false').",
            ),
        ],
        tags=["Notifications"],
    ),
    retrieve=extend_schema(summary="Détail d'une notification", tags=["Notifications"]),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste et détail des notifications de l'utilisateur connecté."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        is_read_param = self.request.query_params.get("is_read")
        if is_read_param is not None:
            normalized = is_read_param.strip().lower()
            if normalized not in ("true", "false"):
                raise ValidationError(
                    {"is_read": "Valeur invalide. Utilisez 'true' ou 'false'."}
                )
            queryset = queryset.filter(is_read=(normalized == "true"))
        return queryset.order_by("-created_at")


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


class MarkAsUnreadView(APIView):
    """PATCH /api/v1/notifications/<uuid>/unread/ — marquer une notification comme non lue."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Marquer une notification comme non lue",
        responses={200: NotificationSerializer},
        tags=["Notifications"],
    )
    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
        updated = mark_as_unread(notification, request.user)
        return Response(NotificationSerializer(updated).data)


class MarkAllAsReadView(APIView):
    """PATCH /api/v1/notifications/read-all/ — marquer toutes les notifications comme lues."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Marquer toutes les notifications comme lues",
        responses={200: {"type": "object", "properties": {"updated_count": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    def patch(self, request):
        count = mark_all_as_read(request.user)
        return Response({"updated_count": count})
