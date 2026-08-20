from django.utils import timezone
from rest_framework import serializers

from apps.users.models import PasswordResetToken, User
from apps.users.services import (
    _hash_code,
    activate_user,
    generate_reset_token,
    invite_user,
    reset_password,
)

from apps.core.tests.base import AuthTestCase
from apps.core.tests.factories import UserFactory

NEW_PASSWORD = "NouveauPass123!"


class ServiceTests(AuthTestCase):
    def test_generate_reset_token_stores_hash(self):
        learner = UserFactory()
        code = generate_reset_token(learner)
        token = PasswordResetToken.objects.get(user=learner, used=False)
        assert len(code) == 6
        assert code.isdigit()
        assert token.token != code
        assert token.token == _hash_code(code)

    def test_generate_reset_token_custom_expiration(self):
        learner = UserFactory()
        generate_reset_token(learner, expires_in=timezone.timedelta(days=7))
        token = PasswordResetToken.objects.get(user=learner)
        assert token.is_expired is False

    def test_reset_password_marks_token_used_for_active_user(self):
        learner = UserFactory()
        assert learner.status == User.Status.ACTIVE
        assert learner.is_active is True
        code = generate_reset_token(learner)
        reset_password(learner.email, code, NEW_PASSWORD)
        token = PasswordResetToken.objects.get(user=learner)
        assert token.used is True
        learner.refresh_from_db()
        assert learner.check_password(NEW_PASSWORD)
        assert learner.password_reset_at is not None

    def test_reset_password_fails_for_pending_user(self):
        pending = UserFactory(pending=True)
        code = generate_reset_token(pending)
        with self.assertRaises(serializers.ValidationError):
            reset_password(pending.email, code, NEW_PASSWORD)

    def test_activate_user_service(self):
        pending = UserFactory(pending=True, first_name="", last_name="")
        code = generate_reset_token(pending)
        activate_user(
            email=pending.email,
            code=code,
            new_password=NEW_PASSWORD,
            first_name="Awa",
            last_name="Diop",
            phone_number="+221771234567",
        )
        token = PasswordResetToken.objects.get(user=pending)
        assert token.used is True
        pending.refresh_from_db()
        assert pending.check_password(NEW_PASSWORD)
        assert pending.password_reset_at is not None
        assert pending.status == User.Status.ACTIVE
        assert pending.is_active is True
        assert pending.first_name == "Awa"
        assert pending.last_name == "Diop"
        assert pending.phone_number == "+221771234567"

    def test_activate_user_fails_for_already_active_user(self):
        active = UserFactory()
        code = generate_reset_token(active)
        with self.assertRaises(serializers.ValidationError):
            activate_user(
                email=active.email,
                code=code,
                new_password=NEW_PASSWORD,
                first_name="Awa",
                last_name="Diop",
            )


    def test_invite_user_get_or_create(self):
        user, created = invite_user("formateur@test.fr", User.Role.TRAINER)
        assert created is True
        assert user.status == User.Status.PENDING
        assert user.is_active is False
        assert user.has_usable_password() is False
        user2, created2 = invite_user("formateur@test.fr", User.Role.TRAINER)
        assert created2 is False
        assert user2.id == user.id

    def test_get_frontend_url_formatting(self):
        from django.test import override_settings
        from apps.users.services import get_frontend_url

        with override_settings(FRONTEND_URL="https://app.academy.xarala.co/"):
            # Valeur par défaut configurée dans settings
            url1 = get_frontend_url("FRONTEND_RESET_PASSWORD_PATH")
            assert url1 == "https://app.academy.xarala.co/reset-password"

            # Setting explicite surchargé
            with override_settings(FRONTEND_RESET_PASSWORD_PATH="/auth/nouveau-reset"):
                url2 = get_frontend_url("FRONTEND_RESET_PASSWORD_PATH")
                assert url2 == "https://app.academy.xarala.co/auth/nouveau-reset"

            # Setting inexistant : utilise le fallback
            url3 = get_frontend_url("FRONTEND_UNKNOWN_SETTING", "/fallback-path")
            assert url3 == "https://app.academy.xarala.co/fallback-path"