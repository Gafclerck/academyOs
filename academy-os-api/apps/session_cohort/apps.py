from django.apps import AppConfig


class CohortSessionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.session_cohort"
    label = "session_cohort"