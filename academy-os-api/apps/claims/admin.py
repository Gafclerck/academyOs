from django.contrib import admin

from .models import Claim


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("id", "learner", "certificate", "status", "handled_by", "created_at")
    list_filter = ("status",)
    search_fields = ("message", "admin_response")
    readonly_fields = ("id", "created_at", "updated_at")
