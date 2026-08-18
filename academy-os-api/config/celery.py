import os
from celery import Celery

# Définir le module de configuration Django par défaut
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('academy_os')

# Charger la configuration Celery depuis les settings Django avec le préfixe 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Découverte automatique des tâches dans tous les packages apps.* (tasks.py)
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
