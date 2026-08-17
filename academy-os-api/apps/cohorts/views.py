from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.users.permissions import IsAdmin
from .models import TrainingPeriod, Cohort
from .serializers import TrainingPeriodSerializer, CohortSerializer


@extend_schema_view(
    list=extend_schema(summary="List all training periods", tags=["Training periods"]),
    create=extend_schema(summary="Create a training period", tags=["Training periods"]),
    retrieve=extend_schema(summary="Retrieve a training period", tags=["Training periods"]),
    update=extend_schema(summary="Update a training period", tags=["Training periods"]),
    partial_update=extend_schema(summary="Partially update a training period", tags=["Training periods"]),
    destroy=extend_schema(summary="Delete a training period", tags=["Training periods"]),
)
class TrainingPeriodViewSet(viewsets.ModelViewSet):
    """Full CRUD on training periods."""

    queryset = TrainingPeriod.objects.all()
    serializer_class = TrainingPeriodSerializer
    permission_classes = [IsAdmin]


@extend_schema_view(
    list=extend_schema(summary="List all cohorts", tags=["Cohorts"]),
    create=extend_schema(summary="Create a cohort", tags=["Cohorts"]),
    retrieve=extend_schema(summary="Retrieve a cohort", tags=["Cohorts"]),
    update=extend_schema(summary="Update a cohort", tags=["Cohorts"]),
    partial_update=extend_schema(summary="Partially update a cohort", tags=["Cohorts"]),
    destroy=extend_schema(summary="Delete a cohort", tags=["Cohorts"]),
)
class CohortViewSet(viewsets.ModelViewSet):
    """Full CRUD on cohorts."""

    queryset = Cohort.objects.select_related("training_period").all()
    serializer_class = CohortSerializer
    permission_classes = [IsAdmin]