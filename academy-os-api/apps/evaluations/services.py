from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.certificates.models import Certificate
from apps.cohorts.models import Cohort, Enrollment, TrainerAssignment
from apps.programs.models import Program
from apps.projects.models import Project
from apps.users.models import User

from .models import CriterionScore, Evaluation, EvaluationCriterion


# ─────────────────────────────────────────────────────────────────────────────
# SERVICE DE NOTATION & ÉVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def grade_learner(evaluator_user: User, data: Dict[str, Any]) -> Evaluation:
    """Enregistre ou met à jour l'évaluation d'un apprenant sur un projet.

    Règles métier :
    - L'inscription et le projet doivent exister.
    - Le projet doit appartenir au programme de la cohorte de l'apprenant.
    - L'évaluateur doit être un administrateur, un gestionnaire ou un formateur
      affecté à la cohorte concernée.
    """
    enrollment_id = data.get("enrollment")
    project_id = data.get("project")
    status = data.get("status", Evaluation.StatusEnum.VALIDATED)
    general_feedback = data.get("general_feedback", "")
    explicit_score = data.get("score")
    criterion_scores_data = data.get("criterion_scores", [])

    try:
        enrollment = Enrollment.objects.select_related("cohort", "cohort__program", "user").get(pk=enrollment_id)
    except Enrollment.DoesNotExist:
        raise ValidationError({"enrollment": ["Inscription introuvable."]})

    try:
        project = Project.objects.select_related("program").get(pk=project_id)
    except Project.DoesNotExist:
        raise ValidationError({"project": ["Projet introuvable."]})

    # Vérifie que le projet appartient bien au programme de la cohorte
    if project.program_id != enrollment.cohort.program_id:
        raise ValidationError({
            "project": ["Ce projet n'appartient pas au programme de la cohorte de l'apprenant."]
        })

    # Vérification des permissions de notation
    if not (evaluator_user.is_superuser or evaluator_user.role in (User.Role.ADMIN, User.Role.ORGANIZER)):
        if evaluator_user.role == User.Role.TRAINER:
            has_assignment = TrainerAssignment.objects.filter(
                cohort=enrollment.cohort,
                user=evaluator_user,
                status=TrainerAssignment.StatusEnum.ACTIVE,
            ).exists()
            if not has_assignment:
                raise PermissionDenied("Vous n'êtes pas affecté à la cohorte de cet apprenant.")
        else:
            raise PermissionDenied("Seuls les formateurs et administrateurs peuvent évaluer un apprenant.")

    with transaction.atomic():
        evaluation, _ = Evaluation.objects.get_or_create(
            enrollment=enrollment,
            project=project,
            defaults={
                "status": status,
                "general_feedback": general_feedback,
                "evaluated_by": evaluator_user,
                "evaluated_at": timezone.now(),
            },
        )

        evaluation.status = status
        evaluation.general_feedback = general_feedback
        evaluation.evaluated_by = evaluator_user
        evaluation.evaluated_at = timezone.now()

        # Enregistrement des notes par critère si fournies
        if criterion_scores_data:
            # Récupérer tous les critères du projet
            project_criteria = {
                c.id: c
                for c in EvaluationCriterion.objects.filter(project=project)
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
                        "criterion": [f"Le critère {crit_id} n'appartient pas à ce projet."]
                    })

                score_val = Decimal(str(item.get("score", 0)))
                level_val = item.get("level", CriterionScore.LevelEnum.IN_PROGRESS)
                feedback_val = item.get("feedback", "")

                CriterionScore.objects.update_or_create(
                    evaluation=evaluation,
                    criterion=criterion,
                    defaults={
                        "score": score_val,
                        "level": level_val,
                        "feedback": feedback_val,
                    },
                )

            # Calcul automatique du score global si non fourni explicitement
            if explicit_score is not None:
                evaluation.score = Decimal(str(explicit_score))
            else:
                calculated = evaluation.calculate_score()
                evaluation.score = Decimal(str(calculated)) if calculated is not None else None
        else:
            if explicit_score is not None:
                evaluation.score = Decimal(str(explicit_score))

        evaluation.save()

    return evaluation


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

    # 6. Évaluations
    evaluations_qs = Evaluation.objects.all()
    total_evaluations = evaluations_qs.count()
    validated_evals = evaluations_qs.filter(status=Evaluation.StatusEnum.VALIDATED).count()
    rejected_evals = evaluations_qs.filter(
        status__in=[Evaluation.StatusEnum.REJECTED, Evaluation.StatusEnum.REVISION_REQUIRED]
    ).count()
    pending_evals = evaluations_qs.filter(
        status__in=[Evaluation.StatusEnum.PENDING, Evaluation.StatusEnum.IN_REVIEW]
    ).count()

    evaluations_by_status = {
        status: evaluations_qs.filter(status=status).count()
        for status, _ in Evaluation.StatusEnum.choices
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

    avg_score_res = evaluations_qs.filter(score__isnull=False).aggregate(avg=Avg("score"))
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

    # 10. Dernières évaluations
    recent_evals = (
        Evaluation.objects.select_related(
            "enrollment__user",
            "enrollment__cohort",
            "project",
            "evaluated_by",
        )
        .order_by("-updated_at")[:5]
    )

    recent_evaluations_data = []
    for ev in recent_evals:
        recent_evaluations_data.append({
            "id": str(ev.id),
            "learner_name": ev.enrollment.user.full_name or ev.enrollment.user.email,
            "cohort_name": ev.enrollment.cohort.name,
            "project_title": ev.project.title,
            "status": ev.status,
            "score": float(ev.score) if ev.score is not None else None,
            "evaluated_by": ev.evaluated_by.full_name if ev.evaluated_by else None,
            "updated_at": ev.updated_at.isoformat(),
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

    # Toutes les évaluations de la cohorte
    evaluations = list(
        Evaluation.objects.filter(enrollment__cohort=cohort)
        .select_related("enrollment", "project", "evaluated_by")
        .prefetch_related("criterion_scores__criterion")
    )

    # Indexation des évaluations par (enrollment_id, project_id)
    eval_map: Dict[tuple, Evaluation] = {
        (ev.enrollment_id, ev.project_id): ev for ev in evaluations
    }

    # 1. Statistiques par projet
    projects_stats = []
    cohort_scores = []

    for proj in projects:
        proj_criteria_count = EvaluationCriterion.objects.filter(project=proj).count()
        proj_evals = [ev for ev in evaluations if ev.project_id == proj.id]

        validated_count = sum(1 for ev in proj_evals if ev.status == Evaluation.StatusEnum.VALIDATED)
        revision_count = sum(
            1 for ev in proj_evals
            if ev.status in (Evaluation.StatusEnum.REVISION_REQUIRED, Evaluation.StatusEnum.REJECTED)
        )
        in_review_count = sum(
            1 for ev in proj_evals
            if ev.status in (Evaluation.StatusEnum.PENDING, Evaluation.StatusEnum.IN_REVIEW)
        )
        # Pending learners = learners sans évaluation ou avec statut pending
        evaluated_count = len(proj_evals)
        pending_count = (total_learners - evaluated_count) + in_review_count

        scores_list = [float(ev.score) for ev in proj_evals if ev.score is not None]
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
            "pending_count": pending_count,
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
            ev = eval_map.get((enr.id, proj.id))
            if ev:
                if ev.status == Evaluation.StatusEnum.VALIDATED:
                    validated_p_count += 1
                if ev.score is not None:
                    learner_scores.append(float(ev.score))

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
            mentor_name = enr.mentor.user.full_name or enr.mentor.user.email

        learners_progress.append({
            "enrollment_id": str(enr.id),
            "user_id": str(enr.user.id),
            "full_name": enr.user.full_name or enr.user.email,
            "email": enr.user.email,
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

    total_evals_cohort = len(evaluations)
    total_validated_cohort = sum(1 for ev in evaluations if ev.status == Evaluation.StatusEnum.VALIDATED)
    validation_rate = (
        round((total_validated_cohort / total_evals_cohort) * 100, 2)
        if total_evals_cohort > 0
        else 0.0
    )

    cohort_average_score = (
        round(sum(cohort_scores) / len(cohort_scores), 2)
        if cohort_scores
        else None
    )

    # 3. Statistiques par domaine de compétence
    competency_groups: Dict[str, Dict[str, Any]] = {}
    for ev in evaluations:
        for cs in ev.criterion_scores.all():
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
    }
