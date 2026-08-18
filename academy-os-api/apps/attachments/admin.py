from django.contrib import admin

from .models import Attachment


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "content_type", "uploaded_by", "uploaded_at"]
    readonly_fields = ["original_filename", "content_type", "object_id", "uploaded_by", "uploaded_at"]
    search_fields = ["original_filename"]
    list_select_related = ["content_type", "uploaded_by"]
