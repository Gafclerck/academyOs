"""Tests de la commande ensure_admin (premier admin idempotent)."""

import os
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command

from apps.core.tests.base import AuthTestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User


class EnsureAdminTests(AuthTestCase):
    def run_command(self):
        out = StringIO()
        call_command("ensure_admin", stdout=out)
        return out.getvalue()

    def test_creates_first_admin_from_env(self):
        with patch.dict(
            os.environ,
            {
                "DJANGO_SUPERUSER_EMAIL": "root@academy.test",
                "DJANGO_SUPERUSER_PASSWORD": "StrongPass123!",
            },
        ):
            output = self.run_command()
        admin = User.objects.get(email="root@academy.test")
        assert admin.is_superuser is True
        assert admin.is_staff is True
        assert admin.is_active is True
        assert admin.role == User.Role.ADMIN
        assert admin.has_usable_password() is True
        assert "root@academy.test" in output
        assert "StrongPass123!" not in output

    def test_noop_when_admin_already_exists(self):
        User.objects.create_superuser(email="boss@test.fr", password="Secret123!")
        with patch.dict(
            os.environ,
            {
                "DJANGO_SUPERUSER_EMAIL": "root@academy.test",
                "DJANGO_SUPERUSER_PASSWORD": "StrongPass123!",
            },
        ):
            output = self.run_command()
        assert not User.objects.filter(email="root@academy.test").exists()
        assert "rien à faire" in output

    def test_noop_and_warns_when_env_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            output = self.run_command()
        assert User.objects.count() == 0
        assert "ignorée" in output

    def test_no_privilege_escalation_when_email_taken(self):
        existing = UserFactory()
        with patch.dict(
            os.environ,
            {
                "DJANGO_SUPERUSER_EMAIL": existing.email,
                "DJANGO_SUPERUSER_PASSWORD": "StrongPass123!",
            },
        ):
            output = self.run_command()
        existing.refresh_from_db()
        assert existing.is_superuser is False
        assert existing.is_staff is False
        assert "escalade" in output