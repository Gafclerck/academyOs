from uuid import UUID

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.permissions import IsAdmin, IsAdminOrOrganizer
from .models import Cohort, Enrollment, Intake, TrainerAssignment
from .serializers import (
    AddEmailsSerializer,
    AssignMentorSerializer,
    CohortSerializer,
    EnrollmentSerializer,
    IntakeSerializer,
    MemberBatchResultSerializer,
    TrainerAssignmentSerializer,
)
from .services import add_users_to_cohort, assign_mentor


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


def _get_cohort(cohort_id):
    return get_object_or_404(Cohort, pk=cohort_id)


class _MembersBaseView(generics.ListCreateAPIView):
    """Base commune : liste + ajout batch de membres d'une cohorte."""

    permission_classes = [IsAdminOrOrganizer]
    expected_role = None
    model = None

    def get_throttles(self):
        """Applique le throttle 'enroll' (60/h) uniquement sur les requêtes d'écriture (POST)."""
        if self.request.method == "POST":
            throttle = ScopedRateThrottle()
            throttle.scope = "enroll"
            return [throttle]
        return super().get_throttles()

    def get_cohort(self):
        return _get_cohort(self.kwargs["cohort_id"])

    def create(self, request, *args, **kwargs):
        cohort = self.get_cohort()
        serializer = AddEmailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        results = add_users_to_cohort(serializer.validated_data["emails"], cohort, self.expected_role)
        return Response({"results": results}, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        summary="List all learners in a cohort",
        description="Liste paginée des inscriptions de la cohorte.",
        tags=["Cohorts"],
    ),
    post=extend_schema(
        summary="Add learners to a cohort",
        description="Ajoute des apprenants par lot d'emails (`emails: [...]`). Résultat individuel par email : `enrolled`, `already_enrolled`, `not_found`, `role_incompatible`.",
        request=AddEmailsSerializer,
        responses={201: MemberBatchResultSerializer},
        tags=["Cohorts"],
    ),
)
class EnrollmentListCreateView(_MembersBaseView):
    expected_role = User.Role.LEARNER
    model = Enrollment
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        return self.model.objects.filter(cohort=self.get_cohort()).select_related(
            "user", "mentor__user"
        )


@extend_schema_view(
    get=extend_schema(
        summary="List all trainers in a cohort",
        description="Liste paginée des affectations de formateurs de la cohorte.",
        tags=["Cohorts"],
    ),
    post=extend_schema(
        summary="Add trainers to a cohort",
        description="Ajoute des formateurs par lot d'emails (`emails: [...]`). Résultat individuel par email : `assigned`, `already_assigned`, `not_found`, `role_incompatible`.",
        request=AddEmailsSerializer,
        responses={201: MemberBatchResultSerializer},
        tags=["Cohorts"],
    ),
)
class TrainerAssignmentListCreateView(_MembersBaseView):
    expected_role = User.Role.TRAINER
    model = TrainerAssignment
    serializer_class = TrainerAssignmentSerializer

    def get_queryset(self):
        return self.model.objects.filter(cohort=self.get_cohort()).select_related("user")


class EnrollmentMentorView(APIView):
    """PATCH /api/v1/cohorts/<id>/enrollments/<id>/ - poser/retirer le mentor."""

    permission_classes = [IsAdminOrOrganizer]

    @extend_schema(
        summary="Assign or remove a mentor for an enrollment",
        description="PATCH {mentor: <uuid> | null} : affecte ou retire le mentor de l'apprenant.",
        request=AssignMentorSerializer,
        responses={200: EnrollmentSerializer},
        tags=["Cohorts"],
    )
    def patch(self, request, cohort_id, enrollment_id):
        cohort = _get_cohort(cohort_id)
        enrollment = get_object_or_404(Enrollment, pk=enrollment_id, cohort=cohort)
        serializer = AssignMentorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trainer_assignment = None
        mentor_id = serializer.validated_data["mentor"]
        if mentor_id is not None:
            trainer_assignment = get_object_or_404(
                TrainerAssignment, pk=mentor_id, cohort=cohort
            )
        enrollment = assign_mentor(enrollment, trainer_assignment)
        return Response(EnrollmentSerializer(enrollment).data)