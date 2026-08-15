from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

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
    """CRUD complet sur les programmes - Réservé aux administrateurs."""

    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdmin]