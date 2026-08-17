from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TrainingPeriodViewSet, CohortViewSet

router = DefaultRouter()
router.register(r"", TrainingPeriodViewSet, basename="training-period")
router.register(r"cohorts", CohortViewSet, basename="cohort")

urlpatterns = [
    path("", include(router.urls)),
]