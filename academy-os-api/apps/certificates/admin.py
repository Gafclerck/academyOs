from django.contrib import admin

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "date_generation",
        "date_envoi",
        "sent_by",
    )
    list_filter = ("status",)
    search_fields = ("id",)
    readonly_fields = ("id", "date_generation", "created_at", "updated_at")
