from django.contrib import admin
from .models import TrainingPeriod


@admin.register(TrainingPeriod)
class TrainingPeriodAdmin(admin.ModelAdmin):
    list_display = ("start_date", "end_date", "status", "created_at", "updated_at")
    list_filter = ("status",)
    ordering = ("-created_at",)