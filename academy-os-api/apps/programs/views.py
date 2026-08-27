from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, viewsets

from apps.cohorts.models import Enrollment, TrainerAssignment
from apps.users.models import User
from apps.users.permissions import IsAdmin
from .models import Program
from .serializers import ProgramSerializer


@extend_schema_view(
    list=extend_schema(summary="Lister tous les programmes", tags=["Programs"]),
    create=extend_schema(summary="Créer un programme", tags=["Programs"]),
    retrieve=extend_schema(summary="Détail d'un programme", tags=["Programs"]),
    update=extend_schema(summary="Modifier complètement un programme", tags=["Programs"]),
    partial_update=extend_schema(summary="Modifier partiellement un programme", tags=["Programs"]),
    destroy=extend_schema(summary="Supprimer un programme", tags=["Programs"]),
)
class ProgramViewSet(viewsets.ModelViewSet):
    """CRUD sur les programmes.

    - Écriture : réservée aux administrateurs.
    - Lecture : filtrée selon le rôle.
      - Admin/Organizer : tous les programmes.
      - Formateur : programmes des cohortes où il est affecté.
      - Apprenant : programmes des cohortes où il est inscrit.
    """

    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return super().get_queryset()
        if user.role == User.Role.TRAINER:
            program_ids = TrainerAssignment.objects.filter(
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).values_list("cohort__program_id", flat=True)
            return super().get_queryset().filter(id__in=program_ids)
        if user.role == User.Role.LEARNER:
            program_ids = Enrollment.objects.filter(
                user=user,
                status=Enrollment.StatusEnum.ACTIVE,
            ).values_list("cohort__program_id", flat=True)
            return super().get_queryset().filter(id__in=program_ids)
        return super().get_queryset().none()
