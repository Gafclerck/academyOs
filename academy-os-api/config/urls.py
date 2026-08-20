from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

API_PREFIX = settings.API_PREFIX.lstrip("/")

urlpatterns = [
    path('admin/', admin.site.urls),
    path(f'{API_PREFIX}/', include('apps.users.urls')),
    path(f'{API_PREFIX}/programs/', include('apps.programs.urls')),
    path(f'{API_PREFIX}/', include('apps.cohorts.urls')),
    path(f'{API_PREFIX}/', include('apps.attachments.urls')),
    path(f'{API_PREFIX}/projects/', include('apps.projects.urls')),
    path(f'{API_PREFIX}/certificates/', include('apps.certificates.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
