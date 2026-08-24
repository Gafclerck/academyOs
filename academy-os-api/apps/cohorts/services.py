"""Services du module cohorts : ajout de membres (apprenants/formateurs) à une
cohorte et mentorat. Chaque email traité individuellement : un échec d'envoi ne
fait pas échouer le reste du lot (une seule connexion SMTP réutilisée)."""

from django.contrib.auth.base_user import BaseUserManager
from django.core import mail
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.users.models import User
from apps.users.services import send_added_to_cohort_email

from .models import Enrollment, TrainerAssignment

ROLE_TO_RELATION = {
    User.Role.LEARNER: ("enrolled", "already_enrolled", Enrollment),
    User.Role.TRAINER: ("assigned", "already_assigned", TrainerAssignment),
}


@transaction.atomic
def add_users_to_cohort(emails, cohort, expected_role):
    """Ajoute des utilisateurs existants à une cohorte, résultat par email.

    expected_role : User.Role.LEARNER (Enrollment) ou User.Role.TRAINER
    (TrainerAssignment). Un email inconnu → not_found ; un rôle différent →
    role_incompatible. Idempotent : un membre déjà présent → already_*.
    """
    created_status, already_status, model = ROLE_TO_RELATION[expected_role]
    results = []
    for raw_email in emails:
        email = BaseUserManager.normalize_email(raw_email).strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            results.append(
                {"email": email, "status": "not_found", "detail": "Aucun compte pour cet email."}
            )
            continue
        if user.status in (User.Status.SUSPENDED, User.Status.ARCHIVED):
            results.append(
                {
                    "email": email,
                    "status": "user_inactive",
                    "detail": "Ce compte est désactivé (suspendu ou archivé).",
                }
            )
            continue
        if user.role != expected_role:
            results.append(
                {
                    "email": email,
                    "status": "role_incompatible",
                    "detail": "Le rôle de ce compte ne correspond pas à ce type de membre.",
                }
            )
            continue
        if model.objects.filter(cohort=cohort, user=user).exists():
            results.append(
                {"email": email, "status": already_status, "detail": "Déjà membre de la cohorte."}
            )
            continue
        member = model.objects.create(cohort=cohort, user=user)
        if expected_role == User.Role.LEARNER:
            from apps.evaluations.services import create_assignments_for_enrollment
            try:
                create_assignments_for_enrollment(member)
            except Exception:
                pass  # L'échec de l'auto-assignation n'empêche pas l'inscription
        try:
            send_added_to_cohort_email(
                email, cohort.name, role=expected_role
            )
        except Exception:
            pass  # L'échec de dispatch n'empêche pas l'ajout ni les autres opérations
        results.append(
            {"email": email, "status": created_status, "detail": "Membre ajouté."}
        )
    return results


def assign_mentor(enrollment, trainer_assignment):
    """Affecte un mentor (TrainerAssignment) à une inscription.

    Le mentor doit appartenir à la MÊME cohorte que l'inscription et avoir un statut actif.
    Retourne l'enrollment ; passer trainer_assignment=None retire le mentor.
    """
    if trainer_assignment is not None:
        if trainer_assignment.cohort_id != enrollment.cohort_id:
            raise ValidationError(
                {
                    "mentor": (
                        "Le mentor doit appartenir à la même cohorte que l'apprenant."
                    )
                }
            )
        if trainer_assignment.status != TrainerAssignment.StatusEnum.ACTIVE:
            raise ValidationError(
                {
                    "mentor": (
                        "Le formateur doit avoir une affectation active pour être mentor."
                    )
                }
            )
    enrollment.mentor = trainer_assignment
    enrollment.save(update_fields=["mentor"])
    return enrollment