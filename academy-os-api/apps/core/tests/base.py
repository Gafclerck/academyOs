"""Classes de base communes aux tests de toutes les apps.

Environnement de test appliqué dans setUp :
- backend email locmem (mail.outbox)
- hasheurs MD5 (rapides)
- throttling DRF neutralisé (réactivé dans les tests dédiés)
"""

import re

from django.conf import settings
from django.core import mail
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle


class AuthTestMixin:
    THROTTLE_SCOPES = ("anon", "user", "login", "invite", "forgot", "reset")

    def setUp(self):
        super().setUp()
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
        settings.REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
        SimpleRateThrottle.THROTTLE_RATES = {
            scope: "1000000/hour" for scope in self.THROTTLE_SCOPES
        }


class AuthAPITestCase(AuthTestMixin, APITestCase):
    """Base pour les tests d'API (permissions, flows HTTP)."""

    def auth(self, user=None):
        """Authentifie le client via force_authenticate (user=None pour déconnecter)."""
        self.client.force_authenticate(user=user)
        return self.client

    def post_json(self, url, data):
        return self.client.post(url, data, format="json")

    def patch_json(self, url, data):
        return self.client.patch(url, data, format="json")

    def get_code_from_last_email(self):
        """Renvoie le code à 6 chiffres contenu dans le dernier email envoyé."""
        assert mail.outbox, "Aucun email envoyé (mail.outbox vide)."
        match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
        assert match, f"Code 6 chiffres introuvable dans l'email : {mail.outbox[-1].body!r}"
        return match.group(1)


class AuthTestCase(AuthTestMixin, TestCase):
    """Base pour les tests unitaires (services)."""