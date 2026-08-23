from rest_framework import permissions

from apps.cohorts.models import TrainerAssignment
from apps.users.models import User


class CanGradeEvaluation(permissions.BasePermission):
    """Permission permettant de noter ou évaluer un livrable / assignation.

    Autorise :
    - Les administrateurs
    - Les organisateurs
    - Les formateurs affectés à la cohorte concernée (y compris les mentors assignés)
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
            # Obtenir la cohorte selon le type d'objet (Deliverable, ProjectAssignment, ou Enrollment)
            if hasattr(obj, "assignment"):
                cohort_id = obj.assignment.enrollment.cohort_id
            elif hasattr(obj, "enrollment"):
                cohort_id = obj.enrollment.cohort_id
            else:
                cohort_id = getattr(obj, "cohort_id", None)

            if not cohort_id:
                return False

            return TrainerAssignment.objects.filter(
                cohort_id=cohort_id,
                user=request.user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()

        return False


class CanViewEvaluation(permissions.BasePermission):
    """Permission de consultation d'une assignation ou d'un livrable.

    - Les administrateurs et organisateurs peuvent tout consulter.
    - Les formateurs peuvent consulter les assignations/livrables des cohortes auxquelles ils sont affectés.
    - Les apprenants peuvent consulter uniquement leurs propres assignations/livrables.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role in (User.Role.ADMIN, User.Role.ORGANIZER):
            return True

        # Résoudre l'enrollment
        enrollment = getattr(obj, "enrollment", None)
        if enrollment is None and hasattr(obj, "assignment"):
            enrollment = obj.assignment.enrollment

        if not enrollment:
            return False

        if user.role == User.Role.TRAINER:
            return TrainerAssignment.objects.filter(
                cohort_id=enrollment.cohort_id,
                user=user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()

        if user.role == User.Role.LEARNER:
            return enrollment.user_id == user.id

        return False
