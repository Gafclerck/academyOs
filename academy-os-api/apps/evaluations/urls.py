from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    CohortStatsView,
    DashboardStatsView,
    EvaluationCriterionViewSet,
    EvaluationViewSet,
    GradeLearnerView,
)

router = SimpleRouter()
router.register(r"criteria", EvaluationCriterionViewSet, basename="criterion")
router.register(r"evaluations", EvaluationViewSet, basename="evaluation")

urlpatterns = [
    path("evaluations/grade/", GradeLearnerView.as_view(), name="grade-learner"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("cohorts/<uuid:cohort_id>/stats/", CohortStatsView.as_view(), name="cohort-stats"),
    path("", include(router.urls)),
]
