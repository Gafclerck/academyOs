from django.contrib import admin

from .models import Deliverable, ProjectAssignment


@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "enrollment", "project", "status", "final_score", "assigned_at")
    list_filter = ("status",)
    search_fields = ("enrollment__user__email", "project__title")


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ("id", "assignment", "version", "status", "score", "submitted_at")
    list_filter = ("status",)
    search_fields = ("assignment__enrollment__user__email",)
