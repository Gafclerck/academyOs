from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.users.permissions import IsAdmin
from .models import Session
from .serializers import SessionSerializer


@extend_schema_view(
    list=extend_schema(summary="Lister toutes les sessions", tags=["Sessions"]),
    create=extend_schema(summary="Créer une session", tags=["Sessions"]),
    retrieve=extend_schema(summary="Détail d'une session", tags=["Sessions"]),
    update=extend_schema(summary="Modifier complètement une session", tags=["Sessions"]),
    partial_update=extend_schema(summary="Modifier partiellement une session", tags=["Sessions"]),
    destroy=extend_schema(summary="Supprimer une session", tags=["Sessions"]),
)
class SessionViewSet(viewsets.ModelViewSet):
    """CRUD complet sur les sessions de cohorte - Réservé aux administrateurs."""

    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAdmin]