from rest_framework import permissions

from apps.cohorts.models import Enrollment, TrainerAssignment
from apps.users.models import User


class CanViewOrManageCohortEnrollments(permissions.BasePermission):
    """Permission pour la liste/création d'inscriptions dans une cohorte.

    - POST (écriture) : Administrateurs et Organisateurs uniquement.
    - GET (lecture) : Administrateurs, Organisateurs, et Formateurs affectés à la cohorte.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return True

        if request.method in permissions.SAFE_METHODS and user.role == User.Role.TRAINER:
            cohort = view.get_cohort()
            return TrainerAssignment.objects.filter(
                cohort=cohort,
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()

        return False


class CanViewOrManageTrainerAssignments(permissions.BasePermission):
    """Permission pour la liste/création d'affectations formateur dans une cohorte.

    - POST (écriture) : Administrateurs et Organisateurs uniquement.
    - GET (lecture) : Administrateurs, Organisateurs, Formateurs affectés et Apprenants inscrits à la cohorte.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return True

        if request.method in permissions.SAFE_METHODS:
            cohort = view.get_cohort()
            if user.role == User.Role.TRAINER:
                return TrainerAssignment.objects.filter(
                    cohort=cohort,
                    user=user,
                    status=TrainerAssignment.StatusEnum.ACTIVE,
                ).exists()
            if user.role == User.Role.LEARNER:
                return Enrollment.objects.filter(
                    cohort=cohort,
                    user=user,
                    status=Enrollment.StatusEnum.ACTIVE,
                ).exists()

        return False

