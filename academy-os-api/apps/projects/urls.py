from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProjectAttachmentUploadView, ProjectViewSet

# Routeur DRF : enregistre les routes CRUD automatiques
# pour le ViewSet ProjectViewSet sous le préfixe vide
# (le préfixe /api/v1/projects/ est défini dans config/urls.py).
router = DefaultRouter()
router.register(r"", ProjectViewSet, basename="project")

urlpatterns = [
    path(
        "<uuid:project_id>/attachments/",
        ProjectAttachmentUploadView.as_view(),
        name="project-attachments",
    ),
    path("", include(router.urls)),
]
