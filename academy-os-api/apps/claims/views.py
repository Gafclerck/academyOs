from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, status as http_status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.cohorts.models import TrainerAssignment
from apps.users.models import User
from apps.users.permissions import IsAdminOrOrganizer, IsLearner

from .models import Claim
from .permissions import CanDeleteClaim
from .serializers import ClaimCreateSerializer, ClaimDetailSerializer, ClaimUpdateSerializer
from .services import create_claim, update_claim_status


# ─────────────────────────────────────────────────────────────────────────────
# VUES RÉCLAMATIONS
# ─────────────────────────────────────────────────────────────────────────────


@extend_schema_view(
    list=extend_schema(
        summary="Lister les réclamations",
        description=(
            "Liste paginée des réclamations. "
            "Les admins/organisateurs voient toutes les réclamations. "
            "Les apprenants ne voient que les leurs."
        ),
        parameters=[
            OpenApiParameter(
                "status",
                str,
                OpenApiParameter.QUERY,
                description=(
                    "Filtrer par statut. Valeurs séparées par des virgules pour "
                    "plusieurs statuts ('pending,in_progress')."
                ),
            ),
        ],
        tags=["Claims"],
    ),
    create=extend_schema(
        summary="Créer une réclamation",
        description="Permet à un apprenant de réclamer un certificat non envoyé.",
        tags=["Claims"],
    ),
    retrieve=extend_schema(
        summary="Détail d'une réclamation",
        tags=["Claims"],
    ),
    update=extend_schema(
        summary="Modifier le statut d'une réclamation",
        description="Admin/organisateur uniquement. Modifier le statut et/ou la réponse.",
        tags=["Claims"],
    ),
    partial_update=extend_schema(
        summary="Modifier partiellement une réclamation",
        tags=["Claims"],
    ),
    destroy=extend_schema(
        summary="Supprimer une réclamation",
        tags=["Claims"],
    ),
)
class ClaimViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des réclamations de certificats.

    - POST /claims/ : création (learner uniquement, auto-assigne l'apprenant)
    - GET /claims/ : liste (admin/organizer — toutes les réclamations)
    - GET /claims/<uuid>/ : détail (propriétaire ou admin/organizer)
    - PATCH /claims/<uuid>/ : mise à jour du statut (admin/organizer uniquement)
    """

    serializer_class = ClaimDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsLearner()]
        if self.action in ("update", "partial_update"):
            return [IsAdminOrOrganizer()]
        if self.action == "destroy":
            return [CanDeleteClaim()]
        if self.action == "stats":
            return [IsAdminOrOrganizer()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        if self.action == "create":
            throttle = ScopedRateThrottle()
            throttle.scope = "claim"
            return [throttle]
        return super().get_throttles()

    def get_serializer_class(self):
        if self.action == "create":
            return ClaimCreateSerializer
        if self.action in ("update", "partial_update"):
            return ClaimUpdateSerializer
        return ClaimDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in (
            User.Role.ADMIN,
            User.Role.ORGANIZER,
        ):
            queryset = Claim.objects.select_related(
                "certificate__inscription__cohort__program",
                "learner",
                "handled_by",
            ).all()
        elif user.role == User.Role.TRAINER:
            assigned_cohort_ids = TrainerAssignment.objects.filter(
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).values_list("cohort_id", flat=True)
            queryset = Claim.objects.select_related(
                "certificate__inscription__cohort__program",
                "learner",
                "handled_by",
            ).filter(
                certificate__inscription__cohort_id__in=assigned_cohort_ids
            )
        elif user.role == User.Role.LEARNER:
            queryset = Claim.objects.select_related(
                "certificate__inscription__cohort__program",
                "learner",
                "handled_by",
            ).filter(learner=user)
        else:
            return Claim.objects.none()

        status_params = self.request.query_params.getlist("status")
        if status_params:
            valid_statuses = dict(Claim.StatusEnum.choices)
            statuses = [
                s.strip()
                for raw in status_params
                for s in raw.split(",")
            ]
            statuses = [s for s in statuses if s]
            # "all" ou valeur vide = aucun filtre (sentinelle du frontend).
            if not statuses or "all" in statuses:
                return queryset
            invalid = [s for s in statuses if s not in valid_statuses]
            if invalid:
                raise ValidationError(
                    {
                        "status": [
                            "Statut invalide. Valeurs acceptées : "
                            + ", ".join(valid_statuses)
                        ]
                    }
                )
            queryset = queryset.filter(status__in=statuses)

        return queryset

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user.is_superuser or user.role in (
            User.Role.ADMIN,
            User.Role.ORGANIZER,
        ):
            return obj
        if user.role == User.Role.TRAINER:
            return obj
        if obj.learner_id != user.id:
            raise PermissionDenied("Vous n'avez pas accès à cette réclamation.")
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        claim = create_claim(
            learner=request.user,
            certificate_id=serializer.validated_data["certificate"],
            message=serializer.validated_data["message"],
        )
        output = ClaimDetailSerializer(claim, context={"request": request})
        return Response(output.data, status=http_status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        claim = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_claim_status(
            claim=claim,
            new_status=serializer.validated_data.get("status", claim.status),
            admin_response=serializer.validated_data.get("admin_response"),
            handled_by=request.user,
        )
        output = ClaimDetailSerializer(updated, context={"request": request})
        return Response(output.data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Compteurs globaux par statut (admin/organisateur uniquement).

        Source des KPIs du dashboard : évite de compter sur la page courante
        de la liste (qui est tronquée par la pagination).
        """
        counts = {
            s: Claim.objects.filter(status=s).count()
            for s in dict(Claim.StatusEnum.choices)
        }
        counts["total"] = sum(counts.values())
        counts["active"] = counts[Claim.StatusEnum.PENDING] + counts[Claim.StatusEnum.IN_PROGRESS]
        return Response(counts)
