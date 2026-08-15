from django.contrib import admin
from .models import Program


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("title", "description")
    ordering = ("-created_at",)

