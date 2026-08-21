from django.contrib import admin
from .models import EvaluationCriterion, Evaluation, CriterionScore


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


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("project", "get_learner", "get_cohort", "status", "score", "evaluated_by", "evaluated_at")
    list_filter = ("status", "project__program", "project", "evaluated_at")
    search_fields = (
        "enrollment__user__email",
        "enrollment__user__first_name",
        "enrollment__user__last_name",
        "project__title",
    )
    inlines = [CriterionScoreInline]

    @admin.display(description="Apprenant")
    def get_learner(self, obj):
        return obj.enrollment.user.full_name or obj.enrollment.user.email

    @admin.display(description="Cohorte")
    def get_cohort(self, obj):
        return obj.enrollment.cohort.name


@admin.register(CriterionScore)
class CriterionScoreAdmin(admin.ModelAdmin):
    list_display = ("evaluation", "criterion", "score", "level")
    list_filter = ("level", "criterion__project")
    search_fields = ("criterion__title", "evaluation__enrollment__user__email")
