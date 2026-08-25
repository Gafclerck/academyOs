from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MarkAllAsReadView, MarkAsReadView, NotificationViewSet, UnreadCountView

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")

urlpatterns = [
    path("unread-count/", UnreadCountView.as_view(), name="notification-unread-count"),
    path("read-all/", MarkAllAsReadView.as_view(), name="notification-read-all"),
    path("<uuid:pk>/read/", MarkAsReadView.as_view(), name="notification-mark-read"),
    path("", include(router.urls)),
]
