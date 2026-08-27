from typing import Any, Dict

from apps.cohorts.models import Cohort, Enrollment
from apps.evaluations.models import ProjectAssignment
from apps.programs.models import Program
from apps.projects.models import Project


def get_program_stats(program: Program) -> Dict[str, Any]:
    """Calcule les statistiques consolidées multi-cohortes pour un programme."""
    cohorts = list(program.cohorts.all())
    total_cohorts = len(cohorts)
    upcoming_cohorts = sum(1 for c in cohorts if c.status == Cohort.StatusEnum.UPCOMING)
    active_cohorts = sum(1 for c in cohorts if c.status == Cohort.StatusEnum.ONGOING)
    completed_cohorts = sum(1 for c in cohorts if c.status == Cohort.StatusEnum.COMPLETED)

    projects = list(program.projects.all().order_by("order"))
    total_projects = len(projects)
    published_projects = sum(1 for p in projects if p.status == Project.StatusProjectEnum.PUBLISHED)

    enrollments = list(
        Enrollment.objects.filter(cohort__in=cohorts).select_related("cohort", "user")
    )
    total_learners = len(enrollments)
    active_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.ACTIVE)
    completed_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.COMPLETED)
    dropped_learners = sum(1 for e in enrollments if e.status == Enrollment.StatusEnum.DROPPED)

    # Assignations
    assignments = list(
        ProjectAssignment.objects.filter(enrollment__cohort__in=cohorts).select_related("project", "enrollment")
    )
    validated_assignments = sum(1 for a in assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
    scores = [float(a.final_score) for a in assignments if a.final_score is not None]
    average_score = round(sum(scores) / len(scores), 2) if scores else None

    # Taux
    completion_rate = (
        round((completed_learners / total_learners) * 100, 2)
        if total_learners > 0
        else 0.0
    )

    total_evaluations = len(assignments)
    validation_rate = (
        round((validated_assignments / total_evaluations) * 100, 2)
        if total_evaluations > 0
        else 0.0
    )

    # Résumé par cohorte
    cohorts_summary = []
    for c in cohorts:
        c_enrollments = [e for e in enrollments if e.cohort_id == c.id]
        c_total = len(c_enrollments)
        c_assignments = [a for a in assignments if a.enrollment.cohort_id == c.id]
        c_validated = sum(1 for a in c_assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
        c_slots = c_total * published_projects
        c_avg_progress = round((c_validated / c_slots) * 100, 2) if c_slots > 0 else 0.0

        cohorts_summary.append({
            "cohort_id": str(c.id),
            "cohort_name": c.name,
            "status": c.status,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "total_learners": c_total,
            "average_progress": c_avg_progress,
        })

    # Stats par projet
    projects_stats = []
    for p in projects:
        p_assignments = [a for a in assignments if a.project_id == p.id]
        p_validated = sum(1 for a in p_assignments if a.status == ProjectAssignment.StatusEnum.VALIDATED)
        p_val_rate = (
            round((p_validated / len(p_assignments)) * 100, 2)
            if p_assignments
            else 0.0
        )
        projects_stats.append({
            "project_id": str(p.id),
            "title": p.title,
            "order": p.order,
            "status": p.status,
            "total_assigned": len(p_assignments),
            "validated_count": p_validated,
            "validation_rate": p_val_rate,
        })

    return {
        "program_id": str(program.id),
        "title": program.title,
        "description": program.description,
        "status": program.status,
        "total_cohorts": total_cohorts,
        "upcoming_cohorts": upcoming_cohorts,
        "active_cohorts": active_cohorts,
        "completed_cohorts": completed_cohorts,
        "total_projects": total_projects,
        "published_projects": published_projects,
        "total_learners": total_learners,
        "active_learners": active_learners,
        "completed_learners": completed_learners,
        "dropped_learners": dropped_learners,
        "completion_rate": completion_rate,
        "validation_rate": validation_rate,
        "average_score": average_score,
        "cohorts_summary": cohorts_summary,
        "projects_stats": projects_stats,
    }
