from django.urls import path

from .views import (
    CertificateAdminListView,
    CertificateDetailView,
    CertificateSendView,
    GenerateCertificateView,
    MyCertificatesView,
)

urlpatterns = [
    path("", CertificateAdminListView.as_view(), name="certificate-list"),
    path("me/", MyCertificatesView.as_view(), name="certificate-me"),
    path("generate/", GenerateCertificateView.as_view(), name="certificate-generate"),
    path("send/", CertificateSendView.as_view(), name="certificate-send"),
    path("<uuid:pk>/", CertificateDetailView.as_view(), name="certificate-detail"),
]
