from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProjectAttachmentDeleteView,
    ProjectAttachmentView,
    ProjectViewSet,
)

# Routeur DRF : enregistre les routes CRUD automatiques
# pour le ViewSet ProjectViewSet sous le préfixe vide
# (le préfixe /api/v1/projects/ est défini dans config/urls.py).
router = DefaultRouter()
router.register(r"", ProjectViewSet, basename="project")

urlpatterns = [
    path(
        "<uuid:project_id>/attachments/",
        ProjectAttachmentView.as_view(),
        name="project-attachments",
    ),
    path(
        "<uuid:project_id>/attachments/<uuid:attachment_id>/",
        ProjectAttachmentDeleteView.as_view(),
        name="project-attachment-detail",
    ),
    path("", include(router.urls)),
]
