from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet

# Routeur DRF : enregistre les routes CRUD automatiques
# pour le ViewSet ProjectViewSet sous le préfixe vide
# (le préfixe /api/v1/projects/ est défini dans config/urls.py).
router = DefaultRouter()
router.register(r"", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
]
