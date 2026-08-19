from django.contrib import admin
from .models import Cohort, Intake


@admin.register(Intake)
class IntakeAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "status", "created_at", "updated_at")
    list_filter = ("status",)
    ordering = ("-created_at",)


@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "program",
        "intake",
        "start_date",
        "end_date",
        "status",
        "created_at",
    )
    list_filter = ("status", "program", "intake")
    search_fields = ("name",)
    ordering = ("-created_at",)