from uuid import UUID

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics, permissions, status
from rest_framework import viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.permissions import IsAdmin, IsAdminOrOrganizer
from .models import Cohort, Enrollment, Intake, TrainerAssignment
from .permissions import (
    CanViewOrManageCohortEnrollments,
    CanViewOrManageTrainerAssignments,
)
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
    """CRUD sur les intakes (sessions/rentrées globales).

    - Écriture : réservée aux administrateurs.
    - Lecture : filtrée selon le rôle.
      - Admin/Organizer : toutes les rentrées.
      - Formateur : rentrées des cohortes où il est affecté.
      - Apprenant : rentrées des cohortes où il est inscrit.
    """

    queryset = Intake.objects.all()
    serializer_class = IntakeSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return super().get_queryset()
        if user.role == User.Role.TRAINER:
            intake_ids = TrainerAssignment.objects.filter(
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).values_list("cohort__intake_id", flat=True)
            return super().get_queryset().filter(id__in=intake_ids)
        if user.role == User.Role.LEARNER:
            intake_ids = Enrollment.objects.filter(
                user=user,
                status=Enrollment.StatusEnum.ACTIVE,
            ).values_list("cohort__intake_id", flat=True)
            return super().get_queryset().filter(id__in=intake_ids)
        return super().get_queryset().none()


@extend_schema_view(
    list=extend_schema(
        summary="List all cohorts",
        description="Liste paginée des cohortes accessibles selon le rôle. Pour un apprenant, `enrolled=all` inclut toutes ses inscriptions (terminées/suspendues) et ajoute `enrollment_status`/`enrolled_at`.",
        parameters=[
            OpenApiParameter(
                name="enrolled",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Apprenant uniquement : `all` pour toutes les inscriptions au lieu des seules cohortes actives.",
            ),
        ],
        tags=["Cohorts"],
    ),
    create=extend_schema(summary="Create a cohort", tags=["Cohorts"]),
    retrieve=extend_schema(summary="Retrieve a cohort", tags=["Cohorts"]),
    update=extend_schema(summary="Update a cohort", tags=["Cohorts"]),
    partial_update=extend_schema(summary="Partially update a cohort", tags=["Cohorts"]),
    destroy=extend_schema(summary="Delete a cohort", tags=["Cohorts"]),
)
class CohortViewSet(viewsets.ModelViewSet):
    """CRUD sur les cohortes.

    - Écriture : réservée aux administrateurs.
    - Lecture : filtrée selon le rôle.
      - Admin/Organizer : toutes les cohortes.
      - Formateur : cohortes où il est affecté.
      - Apprenant : cohortes où il est inscrit.
    """

    queryset = Cohort.objects.select_related("intake", "program").all()
    serializer_class = CohortSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        """Liste les cohortes, filtrable par `intake` et `program` (UUID).

        Pour un apprenant, `enrolled=all` étend la liste à toutes ses
        inscriptions (formations terminées/suspendues incluses) et enrichit
        chaque cohorte de `enrollment_status`/`enrolled_at`.
        """
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            pass
        elif user.role == User.Role.TRAINER:
            cohort_ids = TrainerAssignment.objects.filter(
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).values_list("cohort_id", flat=True)
            queryset = queryset.filter(id__in=cohort_ids)
        elif user.role == User.Role.LEARNER:
            my_enrollments = Enrollment.objects.filter(user=user)
            list_enrollments = my_enrollments
            if self.request.query_params.get("enrolled") != "all":
                list_enrollments = list_enrollments.filter(
                    status=Enrollment.StatusEnum.ACTIVE
                )
            cohort_ids = list_enrollments.values_list("cohort_id", flat=True)
            queryset = queryset.filter(id__in=cohort_ids).prefetch_related(
                Prefetch(
                    "enrollments",
                    queryset=my_enrollments,
                    to_attr="my_enrollment",
                )
            )
        else:
            return queryset.none()

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
    permission_classes = [CanViewOrManageCohortEnrollments]
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
    permission_classes = [CanViewOrManageTrainerAssignments]
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