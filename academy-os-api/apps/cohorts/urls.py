from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import IntakeViewSet, CohortViewSet

intake_router = SimpleRouter()
intake_router.register(r"", IntakeViewSet, basename="intake")

cohort_router = SimpleRouter()
cohort_router.register(r"", CohortViewSet, basename="cohort")

urlpatterns = [
    path("intakes/", include(intake_router.urls)),
    path("cohorts/", include(cohort_router.urls)),
]
