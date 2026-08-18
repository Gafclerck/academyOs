from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, viewsets

from apps.users.permissions import IsAdmin

from .models import Project
from .serializers import ProjectSerializer


# ViewSet CRUD complet pour les projets.
# Lecture (list, retrieve) : tous les utilisateurs authentifiés.
# Écriture (create, update, partial_update, destroy) : administrateurs uniquement.
@extend_schema_view(
    list=extend_schema(summary="Lister les projets", tags=["Projects"]),
    create=extend_schema(summary="Créer un projet", tags=["Projects"]),
    retrieve=extend_schema(summary="Détail d'un projet", tags=["Projects"]),
    update=extend_schema(summary="Modifier un projet", tags=["Projects"]),
    partial_update=extend_schema(
        summary="Modifier partiellement un projet",
        tags=["Projects"],
    ),
    destroy=extend_schema(summary="Supprimer un projet", tags=["Projects"]),
)
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("program").all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]
