from django.urls import path

from .views import AttachmentDetailView, AttachmentUploadView

urlpatterns = [
    path("attachments/", AttachmentUploadView.as_view(), name="attachment-upload"),
    path("attachments/<uuid:pk>/", AttachmentDetailView.as_view(), name="attachment-detail"),
]
