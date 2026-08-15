from rest_framework.permissions import SAFE_METHODS, BasePermission


class HasRole(BasePermission):
    """Permission de base : autorise si user.role est dans allowed_roles.
    Un superuser passe toujours (bypass admin explicite)."""

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return user.role in self.allowed_roles


class IsAdmin(HasRole):
    allowed_roles = ("admin",)

class IsOrganizer(HasRole):
    allowed_roles = ("organizer",)

class IsTrainer(HasRole):
    allowed_roles = ("trainer",)

class IsLearner(HasRole):
    allowed_roles = ("learner",)

class IsAdminOrOrganizer(HasRole):
    allowed_roles = ("admin", "organizer")

class IsAdminOrOrganizerOrTrainer(HasRole):
    allowed_roles = ("admin", "organizer", "trainer")

class ReadOnlyOrHasRole(HasRole):
    """Exemple : lecture ouverte à tous les authentifiés, écriture réservée à allowed_roles."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return super().has_permission(request, view)
