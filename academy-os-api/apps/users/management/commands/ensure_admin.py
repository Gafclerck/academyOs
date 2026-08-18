"""Crée le premier superuser (admin) au démarrage, si nécessaire.

Idempotent et non bloquant :
- si un superuser existe déjà, on ne fait rien ;
- si DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD sont absents, on
  s'arrête avec un message (pas de prompt, donc pas de blocage sous Docker) ;
- jamais d'escalade : si l'email configuré appartient à un compte non-admin,
  on signale et on ne touche à rien ;
- le mot de passe n'est jamais affiché dans les logs.
"""

import os

from django.core.management.base import BaseCommand

from apps.users.models import User


class Command(BaseCommand):
    help = "Crée le premier superuser à partir de DJANGO_SUPERUSER_EMAIL/PASSWORD (idempotent)."

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.SUCCESS("Un admin existe déjà : rien à faire."))
            return

        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Aucun admin en base et DJANGO_SUPERUSER_EMAIL/PASSWORD absents : "
                    "création d'admin ignorée. Définissez ces variables pour créer le premier admin."
                )
            )
            return

        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f"L'email {email} existe déjà mais n'est pas un admin : "
                    "aucune escalade de privilèges effectuée."
                )
            )
            return

        User.objects.create_superuser(
            email=email,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f"Premier admin créé : {email} (mot de passe non affiché)."))