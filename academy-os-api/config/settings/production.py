from django.core.exceptions import ImproperlyConfigured

from .base import *

DEBUG = False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# En production, les fichiers doivent être stockés en S3 (URLs signées) :
# le backend 'local' servirait les octets sans authentification.
if env("STORAGE_BACKEND", default="local") != "s3":
    raise ImproperlyConfigured("STORAGE_BACKEND doit être 's3' en production.")

# En production, les emails doivent partir en SMTP : un backend console ou
# locmem expédierait les invitations/codes dans le vide, silencieusement.
if env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend") == \
        "django.core.mail.backends.console.EmailBackend":
    raise ImproperlyConfigured("EMAIL_BACKEND doit être le backend SMTP en production.")