from django.urls import path

from .views import (
    CertificateDetailView,
    GenerateCertificateView,
    MyCertificatesView,
)

urlpatterns = [
    path("me/", MyCertificatesView.as_view(), name="certificate-me"),
    path("generate/", GenerateCertificateView.as_view(), name="certificate-generate"),
    path("<uuid:pk>/", CertificateDetailView.as_view(), name="certificate-detail"),
]
