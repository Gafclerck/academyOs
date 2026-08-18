from uuid import UUID

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from apps.users.permissions import IsAdmin
from .models import Intake, Cohort
from .serializers import IntakeSerializer, CohortSerializer


@extend_schema_view(
    list=extend_schema(summary="List all intakes", tags=["Intakes"]),
    create=extend_schema(summary="Create an intake", tags=["Intakes"]),
    retrieve=extend_schema(summary="Retrieve an intake", tags=["Intakes"]),
    update=extend_schema(summary="Update an intake", tags=["Intakes"]),
    partial_update=extend_schema(summary="Partially update an intake", tags=["Intakes"]),
    destroy=extend_schema(summary="Delete an intake", tags=["Intakes"]),
)
class IntakeViewSet(viewsets.ModelViewSet):
    """Full CRUD on intakes."""

    queryset = Intake.objects.all()
    serializer_class = IntakeSerializer
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

    queryset = Cohort.objects.select_related("intake", "program").all()
    serializer_class = CohortSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        """Liste les cohortes, filtrable par `intake` et `program` (UUID)."""
        queryset = super().get_queryset()
        for param, field in (("intake", "intake_id"), ("program", "program_id")):
            raw = self.request.query_params.get(param)
            if raw:
                queryset = queryset.filter(**{field: self._parse_uuid(raw, param)})
        return queryset

    @staticmethod
    def _parse_uuid(raw, param):
        try:
            return UUID(raw)
        except ValueError:
            raise ValidationError({param: ["Invalid UUID."]})