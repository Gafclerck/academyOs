from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    EnrollmentListCreateView,
    EnrollmentMentorView,
    IntakeViewSet,
    CohortViewSet,
    TrainerAssignmentListCreateView,
)

intake_router = SimpleRouter()
intake_router.register(r"", IntakeViewSet, basename="intake")

cohort_router = SimpleRouter()
cohort_router.register(r"", CohortViewSet, basename="cohort")

urlpatterns = [
    path("intakes/", include(intake_router.urls)),
    path("cohorts/", include(cohort_router.urls)),
    path(
        "cohorts/<uuid:cohort_id>/enrollments/",
        EnrollmentListCreateView.as_view(),
        name="cohort-enrollments",
    ),
    path(
        "cohorts/<uuid:cohort_id>/trainer-assignments/",
        TrainerAssignmentListCreateView.as_view(),
        name="cohort-trainer-assignments",
    ),
    path(
        "cohorts/<uuid:cohort_id>/enrollments/<uuid:enrollment_id>/",
        EnrollmentMentorView.as_view(),
        name="cohort-enrollment-mentor",
    ),
]
