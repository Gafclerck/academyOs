from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.users.permissions import IsAdmin
from .models import Enrollment
from .serializers import EnrollmentSerializer


@extend_schema_view(
    list=extend_schema(summary="Lister les inscriptions", tags=["Enrollments"]),
    create=extend_schema(summary="Inscrire un apprenant à une cohorte", tags=["Enrollments"]),
    retrieve=extend_schema(summary="Détail d'une inscription", tags=["Enrollments"]),
    update=extend_schema(summary="Modifier une inscription", tags=["Enrollments"]),
    partial_update=extend_schema(summary="Modifier partiellement une inscription", tags=["Enrollments"]),
    destroy=extend_schema(summary="Supprimer une inscription", tags=["Enrollments"]),
)
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("learner", "cohort").all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdmin]
