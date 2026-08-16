from django.contrib import admin
from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("start_date", "end_date", "status", "created_at", "updated_at")
    list_filter = ("status",)
    ordering = ("-created_at",)