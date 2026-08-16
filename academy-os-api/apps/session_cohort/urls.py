from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionViewSet, CohorteViewSet

router = DefaultRouter()
router.register(r"", SessionViewSet, basename="session")
router.register(r"cohortes", CohorteViewSet, basename="cohorte")

urlpatterns = [
    path("", include(router.urls)),
]
