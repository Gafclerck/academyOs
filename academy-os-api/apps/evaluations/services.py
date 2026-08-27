from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.attachments.services import create_attachments
from apps.certificates.models import Certificate
from apps.cohorts.models import Cohort, Enrollment, TrainerAssignment
from apps.evaluations.models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)
from apps.programs.models import Program
from apps.projects.models import Project
from apps.users.models import User


# ─────────────────────────────────────────────────────────────────────────────
# SOUMISSION DE LIVRABLE
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def submit_deliverable(
    assignment: ProjectAssignment,
    user: User,
    data: dict,
    files=None,
) -> Deliverable:
    """Crée une nouvelle version de livrable pour une assignation de projet.

    - Seul l'apprenant concerné par l'inscription (ou un admin) peut soumettre.
    - Bloque si l'inscription est inactive (DROPPED/SUSPENDED).
    - Bloque si le livrable précédent est en attente de review (SUBMITTED)
      ou si l'assignation est déjà validée (VALIDATED).
    - Incrémente automatiquement le numéro de version.
    - Rattache les fichiers joints via create_attachments si présents.
    - Met à jour le statut de l'assignation en 'submitted'.
    """
    if not (user.is_staff or user.is_superuser) and assignment.enrollment.user_id != user.id:
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


# ─────────────────────────────────────────────────────────────────────────────
# CORRECTION & ÉVALUATION CRITÉRIÉE
# ─────────────────────────────────────────────────────────────────────────────

@transaction.atomic
def review_deliverable(
    deliverable: Deliverable,
    trainer: User,
    status_decision: str,
    score: Optional[Decimal] = None,
    feedback: str = "",
    criterion_scores_data: Optional[List[Dict[str, Any]]] = None,
) -> Deliverable:
    """Enregistre l'évaluation / correction d'un livrable par un formateur.

    - Met à jour le statut, le score, le feedback et l'auteur de la correction.
    - Si criterion_scores_data est fourni, crée/met à jour les CriterionScore et
      calcule automatiquement la moyenne pondérée si score n'est pas explicite.
    - Propage la validation et le score final sur le ProjectAssignment parent.
    - En cas de rejet, remet l'assignation en IN_PROGRESS (resoumission possible).
    - En cas de validation, passe l'assignation suivante en IN_PROGRESS.
    - Si tous les projets sont validés, clôture l'inscription (COMPLETED) et prépare le certificat.
    - Bloque si l'assignation est déjà VALIDATED (double validation impossible).
    - Bloque si le livrable n'est pas dans un état reviewable (SUBMITTED).
    """
    if status_decision not in (Deliverable.StatusEnum.VALIDATED, Deliverable.StatusEnum.REJECTED):
        raise ValidationError({"status": "La décision doit être 'validated' ou 'rejected'."})

    assignment = deliverable.assignment

    # 1. Bloquer double validation
    if assignment.status == ProjectAssignment.StatusEnum.VALIDATED:
        raise ValidationError({"detail": "Cette assignation est déjà validée."})

    # 2. Refuser de reviewer un livrable qui n'est pas SUBMITTED
    if deliverable.status != Deliverable.StatusEnum.SUBMITTED:
        raise ValidationError({"detail": "Seuls les livrables en attente peuvent être évalués."})

    # 3. Vérification des permissions du formateur
    if not (trainer.is_superuser or trainer.role in (User.Role.ADMIN, User.Role.ORGANIZER)):
        if trainer.role == User.Role.TRAINER:
            has_assignment = TrainerAssignment.objects.filter(
                cohort=assignment.enrollment.cohort,
                user=trainer,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()
            if not has_assignment:
                raise PermissionDenied("Vous n'êtes pas formateur affecté à la cohorte de ce livrable.")
        else:
            raise PermissionDenied("Seuls les formateurs et administrateurs peuvent évaluer un livrable.")

    # 4. Traitement des critères détaillés si fournis
    if criterion_scores_data:
        project_criteria = {
            c.id: c
            for c in EvaluationCriterion.objects.filter(project=assignment.project)
        }

        for item in criterion_scores_data:
            crit_id = item.get("criterion")
            if isinstance(crit_id, str):
                try:
                    crit_id = UUID(crit_id)
                except ValueError:
                    raise ValidationError({"criterion": [f"UUID de critère invalide: {crit_id}"]})

            criterion = project_criteria.get(crit_id)
            if not criterion:
                raise ValidationError({
                    "criterion": [f"Le critère {crit_id} n'appartient pas au projet de cette assignation."]
                })

            score_val = Decimal(str(item.get("score", 0)))
            level_val = item.get("level", CriterionScore.LevelEnum.IN_PROGRESS)
            feedback_val = item.get("feedback", "")

            CriterionScore.objects.update_or_create(
                deliverable=deliverable,
                criterion=criterion,
                defaults={
                    "score": score_val,
                    "level": level_val,
                    "feedback": feedback_val,
                },
            )

        if score is None:
            score = deliverable.calculate_score()
        else:
            score = Decimal(str(score))
    elif score is not None:
        score = Decimal(str(score))

    # 5. Enregistrement du livrable
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

    # 6. Propagation sur l'assignation
    if status_decision == Deliverable.StatusEnum.VALIDATED:
        assignment.status = ProjectAssignment.StatusEnum.VALIDATED
        assignment.final_score = score
        assignment.save(update_fields=["status", "final_score", "updated_at"])
        _advance_next_assignment(assignment.enrollment, assignment.project.order)
        _check_and_complete_enrollment(assignment.enrollment)
    else:
        assignment.status = ProjectAssignment.StatusEnum.IN_PROGRESS
        assignment.final_score = None
        assignment.save(update_fields=["status", "final_score", "updated_at"])

    return deliverable


# ─────────────────────────────────────────────────────────────────────────────
# PROGRESSION SÉQUENTIELLE & COMPLÉTION DU PARCOURS
# ─────────────────────────────────────────────────────────────────────────────

def _advance_next_assignment(enrollment: Enrollment, current_order: int) -> None:
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


def _check_and_complete_enrollment(enrollment: Enrollment) -> None:
    """Vérifie si tous les projets publiés du programme sont validés.

    Si oui : passe l'inscription en COMPLETED et crée un certificat EN_ATTENTE.
    """
    total_published = Project.objects.filter(
        program=enrollment.cohort.program,
        status=Project.StatusProjectEnum.PUBLISHED,
    ).count()

    if total_published == 0:
        return

    validated_count = ProjectAssignment.objects.filter(
        enrollment=enrollment,
        status=ProjectAssignment.StatusEnum.VALIDATED,
        project__status=Project.StatusProjectEnum.PUBLISHED,
    ).count()

    if validated_count >= total_published:
        if enrollment.status != Enrollment.StatusEnum.COMPLETED:
            enrollment.status = Enrollment.StatusEnum.COMPLETED
            enrollment.save(update_fields=["status", "updated_at"])

        Certificate.objects.get_or_create(
            inscription=enrollment,
            defaults={"status": Certificate.StatusCertificateEnum.PENDING},
        )


# ─────────────────────────────────────────────────────────────────────────────
# DÉTERMINATION DU STATUT INITIAL & AUTO-ASSIGNATION
# ─────────────────────────────────────────────────────────────────────────────

def _get_validated_orders(enrollment: Enrollment) -> set:
    """Retourne l'ensemble des orders des projets déjà validés pour une inscription."""
    return set(
        ProjectAssignment.objects.filter(
            enrollment=enrollment,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        ).values_list("project__order", flat=True)
    )


def _determine_initial_status(
    enrollment: Enrollment,
    project: Project,
    validated_orders: Optional[set] = None,
) -> str:
    """IN_PROGRESS si c'est le premier projet (order <= 1) ou si tous les
    projets d'ordre inférieur sont validés, sinon PENDING.
    """
    if project.order <= 1:
        return ProjectAssignment.StatusEnum.IN_PROGRESS

    if validated_orders is not None:
        earlier_orders = Project.objects.filter(
            program=project.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order__lt=project.order,
        ).values_list("order", flat=True)
        all_prev_validated = all(o in validated_orders for o in earlier_orders)
    else:
        earlier_projects_count = Project.objects.filter(
            program=project.program,
            status=Project.StatusProjectEnum.PUBLISHED,
            order__lt=project.order,
        ).count()
        validated_prev_count = ProjectAssignment.objects.filter(
            enrollment=enrollment,
            project__order__lt=project.order,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        ).count()
        all_prev_validated = (validated_prev_count >= earlier_projects_count)

    if all_prev_validated:
        return ProjectAssignment.StatusEnum.IN_PROGRESS
    return ProjectAssignment.StatusEnum.PENDING


@transaction.atomic
def create_assignments_for_enrollment(enrollment: Enrollment) -> List[ProjectAssignment]:
    """Crée une assignation par projet PUBLISHED du programme pour une inscription."""
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


def create_assignments_for_project(project: Project) -> int:
    """Assigne un projet PUBLISHED à toutes les inscriptions actives du programme."""
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


# ─────────────────────────────────────────────────────────────────────────────
# SERVICES DE STATISTIQUES & KPIS
# ─────────────────────────────────────────────────────────────────────────────

def get_dashboard_stats() -> Dict[str, Any]:
    """Calcule et renvoie l'ensemble des métriques globales pour le Dashboard Admin."""

    # 1. Utilisateurs
    total_users = User.objects.count()
    total_learners = User.objects.filter(role=User.Role.LEARNER).count()
    active_learners = User.objects.filter(role=User.Role.LEARNER, status=User.Status.ACTIVE).count()
    pending_learners = User.objects.filter(role=User.Role.LEARNER, status=User.Status.PENDING).count()
    total_trainers = User.objects.filter(role=User.Role.TRAINER).count()
    total_organizers = User.objects.filter(role=User.Role.ORGANIZER).count()
    total_admins = User.objects.filter(role=User.Role.ADMIN).count()

    # 2. Programmes
    total_programs = Program.objects.count()
    active_programs = Program.objects.filter(status=Program.StatusProgramEnum.ACTIVE).count()

    # 3. Cohortes
    cohorts_qs = Cohort.objects.all()
    total_cohorts = cohorts_qs.count()
    active_cohorts = cohorts_qs.filter(status=Cohort.StatusEnum.ONGOING).count()
    upcoming_cohorts = cohorts_qs.filter(status=Cohort.StatusEnum.UPCOMING).count()
    completed_cohorts = cohorts_qs.filter(status=Cohort.StatusEnum.COMPLETED).count()

    cohorts_by_status = {
        "upcoming": upcoming_cohorts,
        "ongoing": active_cohorts,
        "completed": completed_cohorts,
    }

    # 4. Projets
    total_projects = Project.objects.count()
    published_projects = Project.objects.filter(status=Project.StatusProjectEnum.PUBLISHED).count()

    # 5. Inscriptions
    enrollments_qs = Enrollment.objects.all()
    total_enrollments = enrollments_qs.count()
    enrollments_by_status = {
        status: enrollments_qs.filter(status=status).count()
        for status, _ in Enrollment.StatusEnum.choices
    }

    # 6. Évaluations / Assignations
    assignments_qs = ProjectAssignment.objects.all()
    total_evaluations = assignments_qs.count()
    validated_evals = assignments_qs.filter(status=ProjectAssignment.StatusEnum.VALIDATED).count()
    rejected_evals = Deliverable.objects.filter(status=Deliverable.StatusEnum.REJECTED).count()
    pending_evals = assignments_qs.filter(
        status__in=[
            ProjectAssignment.StatusEnum.PENDING,
            ProjectAssignment.StatusEnum.IN_PROGRESS,
            ProjectAssignment.StatusEnum.SUBMITTED,
        ]
    ).count()

    evaluations_by_status = {
        status: assignments_qs.filter(status=status).count()
        for status, _ in ProjectAssignment.StatusEnum.choices
    }

    # 7. Certificats
    total_certificates = Certificate.objects.count()
    issued_certificates = Certificate.objects.filter(status=Certificate.StatusCertificateEnum.SENT).count()
    pending_certificates = Certificate.objects.filter(status=Certificate.StatusCertificateEnum.PENDING).count()

    # 8. Taux & Moyennes
    completed_enrollments = enrollments_qs.filter(status=Enrollment.StatusEnum.COMPLETED).count()
    global_completion_rate = (
        round((completed_enrollments / total_enrollments) * 100, 2)
        if total_enrollments > 0
        else 0.0
    )

    evaluated_count = validated_evals + rejected_evals
    global_validation_rate = (
        round((validated_evals / evaluated_count) * 100, 2)
        if evaluated_count > 0
        else 0.0
    )

    avg_score_res = assignments_qs.filter(final_score__isnull=False).aggregate(avg=Avg("final_score"))
    average_score = round(float(avg_score_res["avg"]), 2) if avg_score_res["avg"] is not None else 0.0

    learners_per_cohort_avg = (
        round(total_enrollments / total_cohorts, 2)
        if total_cohorts > 0
        else 0.0
    )

    # 9. Compétences
    competency_levels = {
        level: CriterionScore.objects.filter(level=level).count()
        for level, _ in CriterionScore.LevelEnum.choices
    }

    # 10. Dernières évaluations / corrections
    recent_delivs = (
        Deliverable.objects.filter(status__in=[Deliverable.StatusEnum.VALIDATED, Deliverable.StatusEnum.REJECTED])
        .select_related(
            "assignment__enrollment__user",
            "assignment__enrollment__cohort",
            "assignment__project",
            "reviewed_by",
        )
        .order_by("-reviewed_at")[:5]
    )

    recent_evaluations_data = []
    for d in recent_delivs:
        user_obj = d.assignment.enrollment.user
        recent_evaluations_data.append({
            "id": str(d.id),
            "learner_name": f"{user_obj.first_name} {user_obj.last_name}".strip() or user_obj.email,
            "cohort_name": d.assignment.enrollment.cohort.name,
            "project_title": d.assignment.project.title,
            "status": d.status,
            "score": float(d.score) if d.score is not None else None,
            "evaluated_by": f"{d.reviewed_by.first_name} {d.reviewed_by.last_name}".strip() or d.reviewed_by.email if d.reviewed_by else None,
            "updated_at": d.updated_at.isoformat(),
        })

    return {
        "total_users": total_users,
        "total_learners": total_learners,
        "active_learners": active_learners,
        "pending_learners": pending_learners,
        "total_trainers": total_trainers,
        "total_organizers": total_organizers,
        "total_admins": total_admins,
        "total_programs": total_programs,
        "active_programs": active_programs,
        "total_cohorts": total_cohorts,
        "active_cohorts": active_cohorts,
        "upcoming_cohorts": upcoming_cohorts,
        "completed_cohorts": completed_cohorts,
        "total_projects": total_projects,
        "published_projects": published_projects,
        "total_evaluations": total_evaluations,
        "total_validated_evaluations": validated_evals,
        "total_rejected_evaluations": rejected_evals,
        "total_pending_evaluations": pending_evals,
        "total_certificates": total_certificates,
        "issued_certificates": issued_certificates,
        "pending_certificates": pending_certificates,
        "global_completion_rate": global_completion_rate,
        "global_validation_rate": global_validation_rate,
        "average_score": average_score,
        "learners_per_cohort_avg": learners_per_cohort_avg,
        "cohorts_by_status": cohorts_by_status,
        "enrollments_by_status": enrollments_by_status,
        "evaluations_by_status": evaluations_by_status,
        "competency_levels_distribution": competency_levels,
        "recent_evaluations": recent_evaluations_data,
    }


def get_cohort_stats(cohort: Cohort) -> Dict[str, Any]:
    """Calcule les statistiques complètes, progression et validation pour une cohorte."""
    program = cohort.program
    projects = list(Project.objects.filter(program=program).order_by("order"))
    total_projects = len(projects)

    enrollments = list(
        Enrollment.objects.filter(cohort=cohort)
        .select_related("user", "mentor__user")
    )
    total_learners = len(enrollments)

    active_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.ACTIVE)
    completed_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.COMPLETED)
    dropped_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.DROPPED)
    suspended_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.SUSPENDED)

    total_trainers = TrainerAssignment.objects.filter(
        cohort=cohort,
        status=TrainerAssignment.StatusEnum.ACTIVE,
    ).count()

    assigned_mentors_count = sum(1 for e in enrollments if e.mentor_id is not None)
    unassigned_mentors_count = total_learners - assigned_mentors_count

    # Toutes les assignations de la cohorte
    assignments = list(
        ProjectAssignment.objects.filter(enrollment__cohort=cohort)
        .select_related("enrollment", "project")
        .prefetch_related("deliverables__criterion_scores__criterion")
    )

    assign_map: Dict[tuple, ProjectAssignment] = {
        (a.enrollment_id, a.project_id): a for a in assignments
    }

    # 1. Statistiques par projet
    projects_stats = []
    cohort_scores = []

    for proj in projects:
        proj_criteria_count = EvaluationCriterion.objects.filter(project=proj).count()
        proj_assignments = [a for a in assignments if a.project_id == proj.id]

        validated_count = sum(1 for a in proj_assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
        submitted_count = sum(1 for a in proj_assignments if a.status == ProjectAssignment.StatusEnum.SUBMITTED)
        in_progress_count = sum(1 for a in proj_assignments if a.status == ProjectAssignment.StatusEnum.IN_PROGRESS)
        pending_count = sum(1 for a in proj_assignments if a.status == ProjectAssignment.StatusEnum.PENDING)

        # Révisions demandées / rejets sur ce projet
        revision_count = 0
        for a in proj_assignments:
            delivs = list(a.deliverables.all())
            if delivs:
                latest_d = sorted(delivs, key=lambda d: d.version, reverse=True)[0]
                if latest_d and latest_d.status == Deliverable.StatusEnum.REJECTED:
                    revision_count += 1

        evaluated_count = validated_count + revision_count
        pending_total = (total_learners - len(proj_assignments)) + pending_count + in_progress_count + submitted_count

        scores_list = [float(a.final_score) for a in proj_assignments if a.final_score is not None]
        cohort_scores.extend(scores_list)
        proj_avg_score = round(sum(scores_list) / len(scores_list), 2) if scores_list else None

        validation_pct = (
            round((validated_count / total_learners) * 100, 2)
            if total_learners > 0
            else 0.0
        )

        projects_stats.append({
            "project_id": str(proj.id),
            "title": proj.title,
            "order": proj.order,
            "total_criteria_count": proj_criteria_count,
            "total_learners_count": total_learners,
            "evaluated_count": evaluated_count,
            "validated_count": validated_count,
            "revision_count": revision_count,
            "pending_count": pending_total,
            "validation_percentage": validation_pct,
            "average_score": proj_avg_score,
        })

    # 2. Progression individuelle des apprenants
    learners_progress = []
    learner_progress_pcts = []
    learners_completed_all = 0

    for enr in enrollments:
        validated_p_count = 0
        learner_scores = []

        for proj in projects:
            a = assign_map.get((enr.id, proj.id))
            if a:
                if a.status == ProjectAssignment.StatusEnum.VALIDATED:
                    validated_p_count += 1
                if a.final_score is not None:
                    learner_scores.append(float(a.final_score))

        progress_pct = (
            round((validated_p_count / total_projects) * 100, 2)
            if total_projects > 0
            else 0.0
        )
        learner_progress_pcts.append(progress_pct)

        if total_projects > 0 and validated_p_count == total_projects:
            learners_completed_all += 1

        learner_avg_score = (
            round(sum(learner_scores) / len(learner_scores), 2)
            if learner_scores
            else None
        )

        mentor_name = None
        if enr.mentor and enr.mentor.user:
            m_user = enr.mentor.user
            mentor_name = f"{m_user.first_name} {m_user.last_name}".strip() or m_user.email

        u = enr.user
        learners_progress.append({
            "enrollment_id": str(enr.id),
            "user_id": str(u.id),
            "full_name": f"{u.first_name} {u.last_name}".strip() or u.email,
            "email": u.email,
            "mentor_name": mentor_name,
            "validated_projects_count": validated_p_count,
            "total_projects_count": total_projects,
            "progress_percentage": progress_pct,
            "average_score": learner_avg_score,
            "status": enr.status,
        })

    average_progress = (
        round(sum(learner_progress_pcts) / len(learner_progress_pcts), 2)
        if learner_progress_pcts
        else 0.0
    )

    completion_rate = (
        round((learners_completed_all / total_learners) * 100, 2)
        if total_learners > 0
        else 0.0
    )

    total_validated_cohort = sum(1 for a in assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
    evaluated_total = total_validated_cohort + sum(
        1 for a in assignments if any(d.status == Deliverable.StatusEnum.REJECTED for d in a.deliverables.all())
    )
    validation_rate = (
        round((total_validated_cohort / evaluated_total) * 100, 2)
        if evaluated_total > 0
        else 0.0
    )

    cohort_average_score = (
        round(sum(cohort_scores) / len(cohort_scores), 2)
        if cohort_scores
        else None
    )

    # 3. Statistiques par domaine de compétence
    competency_groups: Dict[str, Dict[str, Any]] = {}
    for a in assignments:
        for d in a.deliverables.all():
            for cs in d.criterion_scores.all():
                comp_name = cs.criterion.competency_name or "Général"
                if comp_name not in competency_groups:
                    competency_groups[comp_name] = {
                        "scores": [],
                        "mastered_count": 0,
                        "acquired_count": 0,
                        "in_progress_count": 0,
                        "not_acquired_count": 0,
                    }
                group = competency_groups[comp_name]
                group["scores"].append(float(cs.score))
                if cs.level == CriterionScore.LevelEnum.MASTERED:
                    group["mastered_count"] += 1
                elif cs.level == CriterionScore.LevelEnum.ACQUIRED:
                    group["acquired_count"] += 1
                elif cs.level == CriterionScore.LevelEnum.IN_PROGRESS:
                    group["in_progress_count"] += 1
                elif cs.level == CriterionScore.LevelEnum.NOT_ACQUIRED:
                    group["not_acquired_count"] += 1

    competency_stats = []
    for comp_name, data_group in competency_groups.items():
        avg_comp = (
            round(sum(data_group["scores"]) / len(data_group["scores"]), 2)
            if data_group["scores"]
            else None
        )
        competency_stats.append({
            "competency_name": comp_name,
            "average_score": avg_comp,
            "mastered_count": data_group["mastered_count"],
            "acquired_count": data_group["acquired_count"],
            "in_progress_count": data_group["in_progress_count"],
            "not_acquired_count": data_group["not_acquired_count"],
        })

    # 4. Identification des apprenants à risque
    learners_at_risk = []
    for lp in learners_progress:
        enr_id = UUID(lp["enrollment_id"])
        enr_assignments = [a for a in assignments if a.enrollment_id == enr_id]
        has_rejections = any(
            sum(1 for d in a.deliverables.all() if d.status == Deliverable.StatusEnum.REJECTED) >= 2
            for a in enr_assignments
        )
        is_stalled = (
            cohort.status == Cohort.StatusEnum.ONGOING
            and total_projects > 0
            and lp["validated_projects_count"] == 0
            and lp["status"] == Enrollment.StatusEnum.ACTIVE
        )
        if has_rejections or is_stalled:
            learners_at_risk.append({
                "enrollment_id": lp["enrollment_id"],
                "user_id": lp["user_id"],
                "full_name": lp["full_name"],
                "email": lp["email"],
                "progress_percentage": lp["progress_percentage"],
                "reason": "Rejets multiples" if has_rejections else "Aucun projet validé dans une cohorte active",
            })

    return {
        "cohort_id": str(cohort.id),
        "cohort_name": cohort.name,
        "program_id": str(program.id),
        "program_name": program.title,
        "status": cohort.status,
        "start_date": cohort.start_date,
        "end_date": cohort.end_date,
        "total_learners": total_learners,
        "active_learners": active_learners,
        "completed_learners": completed_learners,
        "dropped_learners": dropped_learners,
        "suspended_learners": suspended_learners,
        "total_trainers": total_trainers,
        "assigned_mentors_count": assigned_mentors_count,
        "unassigned_mentors_count": unassigned_mentors_count,
        "total_projects": total_projects,
        "average_progress": average_progress,
        "validation_rate": validation_rate,
        "completion_rate": completion_rate,
        "average_score": cohort_average_score,
        "projects_stats": projects_stats,
        "competency_stats": competency_stats,
        "learners_progress": learners_progress,
        "learners_at_risk_count": len(learners_at_risk),
        "learners_at_risk": learners_at_risk,
    }


def get_learner_dashboard_stats(user: User, cohort_id: Optional[UUID] = None) -> Dict[str, Any]:
    """Calcule et renvoie la synthèse complète de progression pour le dashboard Apprenant."""
    if cohort_id:
        enrollment = (
            Enrollment.objects.filter(user=user, cohort_id=cohort_id)
            .select_related("cohort__program", "mentor__user")
            .first()
        )
    else:
        enrollment = (
            Enrollment.objects.filter(user=user, status=Enrollment.StatusEnum.ACTIVE)
            .select_related("cohort__program", "mentor__user")
            .order_by("-enrolled_at")
            .first()
        ) or (
            Enrollment.objects.filter(user=user)
            .select_related("cohort__program", "mentor__user")
            .order_by("-enrolled_at")
            .first()
        )

    if not enrollment:
        return {
            "has_enrollment": False,
            "enrollment_id": None,
            "cohort_id": None,
            "cohort_name": None,
            "program_name": None,
            "mentor_name": None,
            "mentor_email": None,
            "total_projects": 0,
            "validated_projects": 0,
            "progress_percentage": 0.0,
            "average_score": None,
            "current_project": None,
            "recent_deliverables": [],
            "competency_scores": [],
            "certificate_status": None,
            "certificate_id": None,
        }

    program = enrollment.cohort.program
    published_projects = list(
        Project.objects.filter(program=program, status=Project.StatusProjectEnum.PUBLISHED).order_by("order")
    )
    total_projects = len(published_projects)

    assignments = list(
        ProjectAssignment.objects.filter(enrollment=enrollment)
        .select_related("project")
        .prefetch_related(
            "deliverables__attachments",
            "deliverables__reviewed_by",
            "deliverables__criterion_scores__criterion",
        )
        .order_by("project__order")
    )

    validated_count = sum(1 for a in assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
    scores = [float(a.final_score) for a in assignments if a.final_score is not None]
    average_score = round(sum(scores) / len(scores), 2) if scores else None

    progress_percentage = (
        round((validated_count / total_projects) * 100, 2)
        if total_projects > 0
        else 0.0
    )

    current_assignment = None
    for a in assignments:
        if a.status in (ProjectAssignment.StatusEnum.IN_PROGRESS, ProjectAssignment.StatusEnum.SUBMITTED):
            current_assignment = a
            break
    if not current_assignment:
        for a in assignments:
            if a.status == ProjectAssignment.StatusEnum.PENDING:
                current_assignment = a
                break

    current_project_data = None
    if current_assignment:
        current_project_data = {
            "assignment_id": str(current_assignment.id),
            "project_id": str(current_assignment.project.id),
            "title": current_assignment.project.title,
            "order": current_assignment.project.order,
            "description": current_assignment.project.description,
            "status": current_assignment.status,
            "deadline": current_assignment.deadline_override.isoformat() if current_assignment.deadline_override else None,
        }

    mentor_name = None
    mentor_email = None
    if enrollment.mentor and enrollment.mentor.user:
        m_user = enrollment.mentor.user
        mentor_name = f"{m_user.first_name} {m_user.last_name}".strip() or m_user.email
        mentor_email = m_user.email

    recent_delivs = (
        Deliverable.objects.filter(assignment__enrollment=enrollment)
        .select_related("assignment__project", "reviewed_by")
        .order_by("-submitted_at")[:5]
    )
    recent_deliverables_data = []
    for d in recent_delivs:
        recent_deliverables_data.append({
            "id": str(d.id),
            "assignment_id": str(d.assignment_id),
            "project_title": d.assignment.project.title,
            "version": d.version,
            "status": d.status,
            "score": float(d.score) if d.score is not None else None,
            "feedback": d.feedback,
            "submitted_at": d.submitted_at.isoformat() if d.submitted_at else None,
            "reviewed_at": d.reviewed_at.isoformat() if d.reviewed_at else None,
            "reviewed_by_name": f"{d.reviewed_by.first_name} {d.reviewed_by.last_name}".strip() or d.reviewed_by.email if d.reviewed_by else None,
        })

    competency_map = {}
    for a in assignments:
        for d in a.deliverables.all():
            for cs in d.criterion_scores.all():
                c_name = cs.criterion.competency_name or "Général"
                if c_name not in competency_map:
                    competency_map[c_name] = {
                        "scores": [],
                        "level": cs.level,
                    }
                competency_map[c_name]["scores"].append(float(cs.score))
                competency_map[c_name]["level"] = cs.level

    competency_scores_data = []
    for c_name, c_val in competency_map.items():
        avg_s = round(sum(c_val["scores"]) / len(c_val["scores"]), 2) if c_val["scores"] else None
        competency_scores_data.append({
            "competency_name": c_name,
            "average_score": avg_s,
            "latest_level": c_val["level"],
        })

    cert = Certificate.objects.filter(inscription=enrollment).first()
    certificate_status = cert.status if cert else None
    certificate_id = str(cert.id) if cert else None

    return {
        "has_enrollment": True,
        "enrollment_id": str(enrollment.id),
        "cohort_id": str(enrollment.cohort.id),
        "cohort_name": enrollment.cohort.name,
        "program_name": program.title,
        "mentor_name": mentor_name,
        "mentor_email": mentor_email,
        "total_projects": total_projects,
        "validated_projects": validated_count,
        "progress_percentage": progress_percentage,
        "average_score": average_score,
        "current_project": current_project_data,
        "recent_deliverables": recent_deliverables_data,
        "competency_scores": competency_scores_data,
        "certificate_status": certificate_status,
        "certificate_id": certificate_id,
    }


def get_trainer_dashboard_stats(trainer: User) -> Dict[str, Any]:
    """Calcule et renvoie la vue multi-cohortes consolidée pour le dashboard Formateur."""
    active_assignments = list(
        TrainerAssignment.objects.filter(
            user=trainer,
            status=TrainerAssignment.StatusEnum.ACTIVE,
        ).select_related("cohort__program")
    )

    cohort_ids = [ta.cohort_id for ta in active_assignments]
    total_assigned_cohorts = len(cohort_ids)

    enrollments_qs = list(
        Enrollment.objects.filter(
            cohort_id__in=cohort_ids,
            status=Enrollment.StatusEnum.ACTIVE,
        ).select_related("user", "cohort__program")
    )

    total_students = len(enrollments_qs)

    active_ta_ids = [ta.id for ta in active_assignments]
    direct_mentees_count = Enrollment.objects.filter(
        mentor_id__in=active_ta_ids,
        status=Enrollment.StatusEnum.ACTIVE,
    ).count()

    pending_deliverables_qs = (
        Deliverable.objects.filter(
            assignment__enrollment__cohort_id__in=cohort_ids,
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        .select_related(
            "assignment__enrollment__user",
            "assignment__enrollment__cohort",
            "assignment__project",
            "submitted_by",
        )
        .order_by("submitted_at")
    )
    pending_reviews_count = pending_deliverables_qs.count()

    pending_reviews_data = []
    for d in pending_deliverables_qs[:10]:
        user_obj = d.assignment.enrollment.user
        pending_reviews_data.append({
            "deliverable_id": str(d.id),
            "assignment_id": str(d.assignment_id),
            "learner_id": str(user_obj.id),
            "learner_name": f"{user_obj.first_name} {user_obj.last_name}".strip() or user_obj.email,
            "learner_email": user_obj.email,
            "cohort_id": str(d.assignment.enrollment.cohort_id),
            "cohort_name": d.assignment.enrollment.cohort.name,
            "project_title": d.assignment.project.title,
            "version": d.version,
            "submitted_at": d.submitted_at.isoformat() if d.submitted_at else None,
            "repo_url": d.repo_url,
            "live_url": d.live_url,
        })

    cohorts_summary_data = []
    for ta in active_assignments:
        c = ta.cohort
        c_enrollments = [e for e in enrollments_qs if e.cohort_id == c.id]
        c_learners_count = len(c_enrollments)

        total_p = Project.objects.filter(program=c.program, status=Project.StatusProjectEnum.PUBLISHED).count()
        validated_p = ProjectAssignment.objects.filter(
            enrollment__cohort=c,
            status=ProjectAssignment.StatusEnum.VALIDATED,
        ).count()
        total_slots = c_learners_count * total_p
        avg_progress = round((validated_p / total_slots) * 100, 2) if total_slots > 0 else 0.0

        cohorts_summary_data.append({
            "cohort_id": str(c.id),
            "cohort_name": c.name,
            "program_name": c.program.title,
            "status": c.status,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "learners_count": c_learners_count,
            "average_progress": avg_progress,
        })

    recent_reviews_qs = (
        Deliverable.objects.filter(reviewed_by=trainer)
        .select_related(
            "assignment__enrollment__user",
            "assignment__enrollment__cohort",
            "assignment__project",
        )
        .order_by("-reviewed_at")[:5]
    )
    recent_reviews_data = []
    for d in recent_reviews_qs:
        user_obj = d.assignment.enrollment.user
        recent_reviews_data.append({
            "deliverable_id": str(d.id),
            "learner_name": f"{user_obj.first_name} {user_obj.last_name}".strip() or user_obj.email,
            "cohort_name": d.assignment.enrollment.cohort.name,
            "project_title": d.assignment.project.title,
            "status": d.status,
            "score": float(d.score) if d.score is not None else None,
            "reviewed_at": d.reviewed_at.isoformat() if d.reviewed_at else None,
        })

    return {
        "total_assigned_cohorts": total_assigned_cohorts,
        "total_students": total_students,
        "direct_mentees_count": direct_mentees_count,
        "pending_reviews_count": pending_reviews_count,
        "pending_reviews": pending_reviews_data,
        "cohorts_summary": cohorts_summary_data,
        "recent_reviews": recent_reviews_data,
    }


def get_enrollment_progress(enrollment: Enrollment) -> Dict[str, Any]:
    """Calcule la fiche de progression détaillée d'un apprenant pour une inscription."""
    user = enrollment.user
    cohort = enrollment.cohort
    program = cohort.program

    published_projects = list(
        Project.objects.filter(program=program, status=Project.StatusProjectEnum.PUBLISHED).order_by("order")
    )
    total_projects = len(published_projects)

    assignments = list(
        ProjectAssignment.objects.filter(enrollment=enrollment)
        .select_related("project")
        .prefetch_related(
            "deliverables__attachments",
            "deliverables__reviewed_by",
            "deliverables__criterion_scores__criterion",
        )
        .order_by("project__order")
    )

    validated_count = sum(1 for a in assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
    scores = [float(a.final_score) for a in assignments if a.final_score is not None]
    average_score = round(sum(scores) / len(scores), 2) if scores else None

    progress_percentage = (
        round((validated_count / total_projects) * 100, 2)
        if total_projects > 0
        else 0.0
    )

    has_multiple_rejections = any(
        sum(1 for d in a.deliverables.all() if d.status == Deliverable.StatusEnum.REJECTED) >= 2
        for a in assignments
    )
    is_at_risk = has_multiple_rejections or (
        enrollment.status == Enrollment.StatusEnum.ACTIVE
        and total_projects > 0
        and validated_count == 0
        and cohort.status == Cohort.StatusEnum.ONGOING
    )
    risk_reason = None
    if has_multiple_rejections:
        risk_reason = "Plusieurs rejets consécutifs sur un ou plusieurs livrables"
    elif is_at_risk:
        risk_reason = "Aucun projet validé dans une cohorte en cours"

    mentor_name = None
    mentor_email = None
    if enrollment.mentor and enrollment.mentor.user:
        m_user = enrollment.mentor.user
        mentor_name = f"{m_user.first_name} {m_user.last_name}".strip() or m_user.email
        mentor_email = m_user.email

    assignments_data = []
    for a in assignments:
        delivs = list(a.deliverables.all())
        latest_d = sorted(delivs, key=lambda d: d.version, reverse=True)[0] if delivs else None
        assignments_data.append({
            "id": str(a.id),
            "project_id": str(a.project_id),
            "project_title": a.project.title,
            "project_order": a.project.order,
            "status": a.status,
            "final_score": float(a.final_score) if a.final_score is not None else None,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "deadline": a.deadline_override.isoformat() if a.deadline_override else None,
            "deliverables_count": len(delivs),
            "latest_deliverable_status": latest_d.status if latest_d else None,
            "latest_deliverable_version": latest_d.version if latest_d else None,
        })

    competency_map = {}
    for a in assignments:
        for d in a.deliverables.all():
            for cs in d.criterion_scores.all():
                c_name = cs.criterion.competency_name or "Général"
                if c_name not in competency_map:
                    competency_map[c_name] = {
                        "scores": [],
                        "level": cs.level,
                    }
                competency_map[c_name]["scores"].append(float(cs.score))
                competency_map[c_name]["level"] = cs.level

    competency_stats = []
    for c_name, c_val in competency_map.items():
        avg_s = round(sum(c_val["scores"]) / len(c_val["scores"]), 2) if c_val["scores"] else None
        competency_stats.append({
            "competency_name": c_name,
            "average_score": avg_s,
            "level": c_val["level"],
        })

    cert = Certificate.objects.filter(inscription=enrollment).first()

    return {
        "enrollment_id": str(enrollment.id),
        "user_id": str(user.id),
        "user_full_name": f"{user.first_name} {user.last_name}".strip() or user.email,
        "user_email": user.email,
        "cohort_id": str(cohort.id),
        "cohort_name": cohort.name,
        "program_id": str(program.id),
        "program_name": program.title,
        "status": enrollment.status,
        "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
        "mentor_name": mentor_name,
        "mentor_email": mentor_email,
        "total_projects": total_projects,
        "validated_projects": validated_count,
        "progress_percentage": progress_percentage,
        "average_score": average_score,
        "is_at_risk": is_at_risk,
        "risk_reason": risk_reason,
        "assignments": assignments_data,
        "competency_stats": competency_stats,
        "certificate_status": cert.status if cert else None,
        "certificate_id": str(cert.id) if cert else None,
    }

