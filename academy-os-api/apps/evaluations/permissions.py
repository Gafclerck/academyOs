from rest_framework import permissions

from apps.cohorts.models import TrainerAssignment
from apps.users.models import User


class CanGradeEvaluation(permissions.BasePermission):
    """Permission permettant de noter ou évaluer un apprenant.

    Autorise :
    - Les administrateurs
    - Les organisateurs
    - Les formateurs affectés à la cohorte de l'apprenant (y compris les mentors assignés)
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in (
            User.Role.ADMIN,
            User.Role.ORGANIZER,
            User.Role.TRAINER,
        )

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or request.user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return True

        if request.user.role == User.Role.TRAINER:
            cohort_id = obj.enrollment.cohort_id if hasattr(obj, "enrollment") else getattr(obj, "cohort_id", None)
            if not cohort_id:
                return False
            return TrainerAssignment.objects.filter(
                cohort_id=cohort_id,
                user=request.user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()

        return False


class CanViewEvaluation(permissions.BasePermission):
    """Permission de consultation d'une évaluation.

    - Les administrateurs et organisateurs peuvent tout consulter.
    - Les formateurs peuvent consulter les évaluations des cohortes auxquelles ils sont affectés.
    - Les apprenants peuvent consulter uniquement leurs propres évaluations.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return True

        if user.role == User.Role.TRAINER:
            return TrainerAssignment.objects.filter(
                cohort_id=obj.enrollment.cohort_id,
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()

        if user.role == User.Role.LEARNER:
            return obj.enrollment.user_id == user.id

        return False
