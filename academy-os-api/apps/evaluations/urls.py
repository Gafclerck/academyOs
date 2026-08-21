from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.evaluations.views import (
    CohortStatsView,
    DashboardStatsView,
    DeliverableDetailView,
    DeliverableListView,
    DeliverableReviewView,
    DeliverableSubmitView,
    EvaluationCriterionViewSet,
    ProjectAssignmentViewSet,
)

router = DefaultRouter()
router.register(r"criteria", EvaluationCriterionViewSet, basename="criterion")
router.register(r"assignments", ProjectAssignmentViewSet, basename="assignment")

urlpatterns = [
    path(
        "assignments/<uuid:assignment_id>/deliverables/",
        DeliverableListView.as_view(),
        name="deliverable-list",
    ),
    path(
        "assignments/<uuid:assignment_id>/deliverables/submit/",
        DeliverableSubmitView.as_view(),
        name="deliverable-submit",
    ),
    path(
        "deliverables/<uuid:deliverable_id>/review/",
        DeliverableReviewView.as_view(),
        name="deliverable-review",
    ),
    path(
        "deliverables/<uuid:pk>/",
        DeliverableDetailView.as_view(),
        name="deliverable-detail",
    ),
    path("cohorts/<uuid:cohort_id>/stats/", CohortStatsView.as_view(), name="cohort-stats"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("", include(router.urls)),
]
