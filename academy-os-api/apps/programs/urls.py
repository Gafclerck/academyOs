from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProgramStatsView, ProgramViewSet

router = DefaultRouter()
router.register(r"", ProgramViewSet, basename="program")

urlpatterns = [
    path("<uuid:program_id>/stats/", ProgramStatsView.as_view(), name="program-stats"),
    path("", include(router.urls)),
]
