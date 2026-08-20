from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.attachments.services import create_attachments
from apps.evaluations.models import Deliverable, ProjectAssignment


# ---------------------------------------------------------------------------
# Soumission & correction
# ---------------------------------------------------------------------------


@transaction.atomic
def submit_deliverable(assignment: ProjectAssignment, user, data: dict, files=None) -> Deliverable:
    """Crée une nouvelle version de livrable pour une assignation de projet.

    - Seul l'apprenant concerné par l'inscription (ou un admin) peut soumettre.
    - Bloque si l'inscription est inactive (DROPPED/SUSPENDED).
    - Bloque si le livrable précédent est en attente de review (SUBMITTED)
      ou si l'assignation est déjà validée (VALIDATED).
    - Incrémente automatiquement le numéro de version.
    - Rattache les fichiers joints via create_attachments si présents.
    - Met à jour le statut de l'assignation en 'submitted'.
    """
    from apps.cohorts.models import Enrollment

    if not user.is_staff and assignment.enrollment.user_id != user.id:
        raise PermissionDenied("Vous n'êtes pas autorisé à soumettre un livrable pour cette inscription.")

    if assignment.enrollment.status in (
        Enrollment.StatusEnum.DROPPED,
        Enrollment.StatusEnum.SUSPENDED,
    ):
        raise ValidationError(
            {"detail": "Votre inscription est inactive. Impossible de soumettre un livrable."}
        )

    if assignment.status in (
        ProjectAssignment.StatusEnum.SUBMITTED,
        ProjectAssignment.StatusEnum.VALIDATED,
    ):
        raise ValidationError(
            {"detail": "Impossible de soumettre un livrable pour le moment."}
        )

    latest_version = (
        assignment.deliverables.order_by("-version").values_list("version", flat=True).first() or 0
    )
    new_version = latest_version + 1

    deliverable = Deliverable.objects.create(
        assignment=assignment,
        version=new_version,
        submitted_by=user,
        submitted_at=timezone.now(),
        repo_url=data.get("repo_url", "").strip(),
        live_url=data.get("live_url", "").strip(),
        comments=data.get("comments", "").strip(),
        status=Deliverable.StatusEnum.SUBMITTED,
    )

    if files:
        create_attachments(user, files, parent=deliverable)

    assignment.status = ProjectAssignment.StatusEnum.SUBMITTED
    assignment.save(update_fields=["status", "updated_at"])

    return deliverable


@transaction.atomic
def review_deliverable(
    deliverable: Deliverable,
    trainer,
    status_decision: str,
    score: int,
    feedback: str = "",
) -> Deliverable:
    """Enregistre l'évaluation / correction d'un livrable par un formateur.

    - Met à jour le statut, le score, le feedback et l'auteur de la correction.
    - Propage la validation et le score final sur le ProjectAssignment parent.
    - En cas de rejet, remet l'assignation en IN_PROGRESS (resoumission possible).
    - En cas de validation, passe l'assignation suivante en IN_PROGRESS.
    - Bloque si l'assignation est déjà VALIDATED (double validation impossible).
    - Bloque si le livrable n'est pas dans un état reviewable (SUBMITTED).
    """
    if status_decision not in (Deliverable.StatusEnum.VALIDATED, Deliverable.StatusEnum.REJECTED):
        raise ValidationError({"status": "La décision doit être 'validated' ou 'rejected'."})

    assignment = deliverable.assignment

    # 1.1 — Bloquer double validation
    if assignment.status == ProjectAssignment.StatusEnum.VALIDATED:
        raise ValidationError({"detail": "Cette assignation est déjà validée."})

    # Refuser de reviewer un livrable qui n'est pas SUBMITTED
    if deliverable.status != Deliverable.StatusEnum.SUBMITTED:
        raise ValidationError({"detail": "Seuls les livrables en attente peuvent être évalués."})

    deliverable.status = status_decision
    deliverable.reviewed_by = trainer
    deliverable.reviewed_at = timezone.now()
    deliverable.score = score
    deliverable.feedback = feedback.strip()
    deliverable.save(
        update_fields=[
            "status",
            "reviewed_by",
            "reviewed_at",
            "score",
            "feedback",
            "updated_at",
        ]
    )

    if status_decision == Deliverable.StatusEnum.VALIDATED:
        assignment.status = ProjectAssignment.StatusEnum.VALIDATED
        assignment.final_score = score
        assignment.save(update_fields=["status", "final_score", "updated_at"])
        _advance_next_assignment(assignment.enrollment, assignment.project.order)
    else:
        assignment.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        assignment.final_score = None
        assignment.save(update_fields=["status", "final_score", "updated_at"])

    return deliverable


# ---------------------------------------------------------------------------
# Auto-progression séquentielle
# ---------------------------------------------------------------------------


def _advance_next_assignment(enrollment, current_order: int) -> None:
    """Passe la prochaine assignation PENDING en IN_PROGRESS (après validation)."""
    next_a = (
        ProjectAssignment.objects.filter(
            enrollment=enrollment,
            project__order__gt=current_order,
            status=ProjectAssignment.StatusEnum.PENDING,
        )
        .order_by("project__order")
        .first()
    )
    if next_a:
        next_a.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        next_a.save(update_fields=["status", "updated_at"])


# ---------------------------------------------------------------------------
# Détermination du statut initial d'une assignation
# ---------------------------------------------------------------------------


def _get_validated_orders(enrollment) -> set:
    """Retourne l'ensemble des orders des projets déjà validés pour une inscription.
    Utilisé en cache local pour éviter les N+1 dans les batchs."""
    return set(
        ProjectAssignment.objects.filter(
            enrollment=enrollment,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        ).values_list("project__order", flat=True)
    )


def _determine_initial_status(enrollment, project, validated_orders: set | None = None) -> str:
    """IN_PROGRESS si c'est le premier projet (order <= 1) ou si le précédent
    est validé, sinon PENDING.

    Si validated_orders est fourni, l'utilise comme cache au lieu de requêter la DB.
    """
    if project.order <= 1:
        return ProjectAssignment.StatusEnum.IN_PROGRESS
    if validated_orders is not None:
        is_prev_validated = (project.order - 1) in validated_orders
    else:
        is_prev_validated = ProjectAssignment.objects.filter(
            enrollment=enrollment,
            project__order=project.order - 1,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        ).exists()
    if is_prev_validated:
        return ProjectAssignment.StatusEnum.IN_PROGRESS
    return ProjectAssignment.StatusEnum.PENDING


# ---------------------------------------------------------------------------
# Création automatique d'assignations
# ---------------------------------------------------------------------------


@transaction.atomic
def create_assignments_for_enrollment(enrollment) -> list[ProjectAssignment]:
    """Crée une assignation par projet PUBLISHED du programme pour une inscription.
    Utilise un cache local des orders validés pour éviter les N+1."""
    from apps.projects.models import Project

    projects = list(
        Project.objects.filter(
            program=enrollment.cohort.program,
            status=Project.StatusProjectEnum.PUBLISHED,
        ).order_by("order")
    )

    if not projects:
        return []

    validated_orders = _get_validated_orders(enrollment)

    assignments = []
    for project in projects:
        assignment, _ = ProjectAssignment.objects.get_or_create(
            enrollment=enrollment,
            project=project,
            defaults={"status": _determine_initial_status(enrollment, project, validated_orders)},
        )
        assignments.append(assignment)
    return assignments


def create_assignments_for_project(project) -> int:
    """Assigne un projet PUBLISHED à toutes les inscriptions actives du programme.
    Retourne le nombre d'assignations créées. Ignore les projets non publiés.
    Utilise bulk_create pour les performances sur les gros batches."""
    from apps.cohorts.models import Enrollment
    from apps.projects.models import Project

    if project.status != Project.StatusProjectEnum.PUBLISHED:
        return 0

    enrollments = list(
        Enrollment.objects.filter(
            cohort__program=project.program,
            status=Enrollment.StatusEnum.ACTIVE,
        )
    )

    if not enrollments:
        return 0

    # IDs des enrollments qui ont déjà une assignation pour ce projet
    existing = set(
        ProjectAssignment.objects.filter(
            enrollment__in=enrollments,
            project=project,
        ).values_list("enrollment_id", flat=True)
    )

    to_create = []
    for enrollment in enrollments:
        if enrollment.id in existing:
            continue
        status = _determine_initial_status(enrollment, project)
        to_create.append(
            ProjectAssignment(
                enrollment=enrollment,
                project=project,
                status=status,
            )
        )

    if to_create:
        ProjectAssignment.objects.bulk_create(to_create, ignore_conflicts=True)
    return len(to_create)
