from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOW_ALL_ORIGINS = True
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# if DEBUG:
#     INSTALLED_APPS += ['debug_toolbar']
#     MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
#     INTERNAL_IPS = ['127.0.0.1']