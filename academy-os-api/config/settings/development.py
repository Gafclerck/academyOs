from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOW_ALL_ORIGINS = True
# Email : défini dans base.py via l'env (défaut console). Ne pas surcharger ici,
# sinon l'env ne pourrait pas activer le SMTP en développement.