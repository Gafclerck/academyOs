from django.utils import timezone
from rest_framework import serializers

from apps.users.models import PasswordResetToken, User
from apps.users.services import (
    _hash_code,
    create_user_by_admin,
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

    def test_reset_password_marks_token_used(self):
        learner = UserFactory()
        code = generate_reset_token(learner)
        reset_password(learner.email, code, NEW_PASSWORD)
        token = PasswordResetToken.objects.get(user=learner)
        assert token.used is True
        learner.refresh_from_db()
        assert learner.check_password(NEW_PASSWORD)
        assert learner.password_reset_at is not None

    def test_create_user_by_admin_duplicate_email(self):
        existing = UserFactory()
        with self.assertRaises(serializers.ValidationError):
            create_user_by_admin(email=existing.email, role=User.Role.TRAINER)

    def test_create_user_by_admin_creates_account(self):
        user = create_user_by_admin(
            email="nouveau@test.fr", role=User.Role.TRAINER, first_name="Awa", last_name="Diop"
        )
        assert user.role == User.Role.TRAINER
        assert user.first_name == "Awa"
        assert user.has_usable_password() is False
        assert PasswordResetToken.objects.filter(user=user).exists()

    def test_invite_user_get_or_create(self):
        user, created = invite_user("formateur@test.fr", User.Role.TRAINER)
        assert created is True
        assert user.has_usable_password() is False
        user2, created2 = invite_user("formateur@test.fr", User.Role.TRAINER)
        assert created2 is False
        assert user2.id == user.id