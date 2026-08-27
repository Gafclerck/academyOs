from rest_framework.permissions import BasePermission

from apps.claims.models import Claim
from apps.users.models import User


class CanDeleteClaim(BasePermission):
    """Permission de suppression d'une réclamation.

    - Les administrateurs et organisateurs peuvent supprimer n'importe quelle réclamation.
    - Les apprenants ne peuvent supprimer que leurs propres réclamations en statut PENDING.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in (
            User.Role.ADMIN,
            User.Role.ORGANIZER,
            User.Role.LEARNER,
        )

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or request.user.role in (
            User.Role.ADMIN,
            User.Role.ORGANIZER,
        ):
            return True
        if request.user.role == User.Role.LEARNER:
            return (
                obj.learner_id == request.user.id
                and obj.status == Claim.StatusEnum.PENDING
            )
        return False
