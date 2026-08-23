from django.core import mail

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User
from apps.users.services import generate_reset_token

ACTIVATE_URL = f"{API_PREFIX}/auth/activate/"
INVITE_URL = f"{API_PREFIX}/auth/invite/"
LOGIN_URL = f"{API_PREFIX}/auth/login/"
NEW_PASSWORD = "NewSecurePassword123!"


class ActivateAccountTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.organizer = UserFactory(organizer=True)
        self.admin = UserFactory(admin=True)

    def test_activate_successful_journey(self):
        self.auth(self.organizer).post(
            INVITE_URL, {"email": "invite@test.fr", "role": "learner"}, format="json"
        )
        code = self.get_code_from_last_email()
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": "invite@test.fr",
                "code": code,
                "new_password": NEW_PASSWORD,
                "first_name": "Mamadou",
                "last_name": "Diallo",
                "phone_number": "+221771234567",
            },
        )
        assert response.status_code == 200
        assert response.data["detail"] == "Compte activé avec succès."

        user = User.objects.get(email="invite@test.fr")
        assert user.status == User.Status.ACTIVE
        assert user.is_active is True
        assert user.first_name == "Mamadou"
        assert user.last_name == "Diallo"
        assert user.phone_number == "+221771234567"
        assert user.full_name == "Mamadou Diallo"

        # Connexion valide avec le nouveau mot de passe
        login = self.post_json(
            LOGIN_URL, {"email": "invite@test.fr", "password": NEW_PASSWORD}
        )
        assert login.status_code == 200
        assert "access" in login.json()

    def test_activate_requires_all_mandatory_fields(self):
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": "incomplete@test.fr",
                "code": "123456",
                "new_password": NEW_PASSWORD,
            },
        )
        assert response.status_code == 400
        assert "first_name" in response.data
        assert "last_name" in response.data

    def test_activate_empty_names_rejected(self):
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": "spaces@test.fr",
                "code": "123456",
                "new_password": NEW_PASSWORD,
                "first_name": "   ",
                "last_name": "",
            },
        )
        assert response.status_code == 400

    def test_activate_invalid_phone_rejected(self):
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": "phone@test.fr",
                "code": "123456",
                "new_password": NEW_PASSWORD,
                "first_name": "Awa",
                "last_name": "Diop",
                "phone_number": "invalid-phone-format",
            },
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_activate_active_user_rejected(self):
        active_user = UserFactory(email="active@test.fr")
        code = generate_reset_token(active_user)
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": "active@test.fr",
                "code": code,
                "new_password": NEW_PASSWORD,
                "first_name": "Awa",
                "last_name": "Diop",
            },
        )
        assert response.status_code == 400
        assert "déjà activé" in str(response.data)

    def test_activate_suspended_user_rejected(self):
        suspended_user = UserFactory(suspended=True)
        code = generate_reset_token(suspended_user)
        response = self.post_json(
            ACTIVATE_URL,
            {
                "email": suspended_user.email,
                "code": code,
                "new_password": NEW_PASSWORD,
                "first_name": "Awa",
                "last_name": "Diop",
            },
        )
        assert response.status_code == 400
        assert "désactivé" in str(response.data)
