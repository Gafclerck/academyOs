from django.contrib import admin

from .models import (
    CriterionScore,
    Deliverable,
    EvaluationCriterion,
    ProjectAssignment,
)


class CriterionScoreInline(admin.TabularInline):
    model = CriterionScore
    extra = 0
    fields = ("criterion", "score", "level", "feedback")


@admin.register(EvaluationCriterion)
class EvaluationCriterionAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "competency_name", "max_score", "weight", "order")
    list_filter = ("project__program", "project", "competency_name")
    search_fields = ("title", "description", "competency_name", "project__title")
    ordering = ("project", "order")


class DeliverableInline(admin.TabularInline):
    model = Deliverable
    extra = 0
    fields = ("version", "submitted_by", "status", "score", "submitted_at")
    readonly_fields = ("submitted_at",)


@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ("project", "get_learner", "get_cohort", "status", "final_score", "assigned_at")
    list_filter = ("status", "project__program", "project", "assigned_at")
    search_fields = (
        "enrollment__user__email",
        "enrollment__user__first_name",
        "enrollment__user__last_name",
        "project__title",
    )
    inlines = [DeliverableInline]

    @admin.display(description="Apprenant")
    def get_learner(self, obj):
        return f"{obj.enrollment.user.first_name} {obj.enrollment.user.last_name}".strip() or obj.enrollment.user.email

    @admin.display(description="Cohorte")
    def get_cohort(self, obj):
        return obj.enrollment.cohort.name


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ("id", "assignment", "version", "status", "score", "submitted_at", "reviewed_by")
    list_filter = ("status", "reviewed_at")
    search_fields = ("assignment__enrollment__user__email", "assignment__project__title")
    inlines = [CriterionScoreInline]


@admin.register(CriterionScore)
class CriterionScoreAdmin(admin.ModelAdmin):
    list_display = ("deliverable", "criterion", "score", "level")
    list_filter = ("level", "criterion__project")
    search_fields = ("criterion__title", "deliverable__assignment__enrollment__user__email")
