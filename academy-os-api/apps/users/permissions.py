from rest_framework.permissions import BasePermission

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

class IsAdminOrTrainer(HasRole):
    allowed_roles = ("admin", "trainer")

class IsAdminOrOrganizerOrTrainer(HasRole):
    allowed_roles = ("admin", "organizer", "trainer")


