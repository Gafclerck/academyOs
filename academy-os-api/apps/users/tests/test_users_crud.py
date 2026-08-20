from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.users.models import User

USERS_URL = f"{API_PREFIX}/users/"


class UserCRUDTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

    def test_unauthenticated_cannot_access(self):
        assert self.client.get(USERS_URL).status_code == 401

    def test_trainer_and_learner_forbidden(self):
        assert self.auth(self.trainer).get(USERS_URL).status_code == 403
        assert self.auth(self.learner).get(USERS_URL).status_code == 403

    def test_organizer_can_list_and_retrieve_users(self):
        response = self.auth(self.organizer).get(USERS_URL)
        assert response.status_code == 200
        assert response.data["count"] >= 4

        detail_response = self.auth(self.organizer).get(f"{USERS_URL}{self.learner.id}/")
        assert detail_response.status_code == 200
        assert detail_response.data["email"] == self.learner.email

    def test_organizer_cannot_modify_or_delete_user(self):
        url = f"{USERS_URL}{self.learner.id}/"
        assert self.auth(self.organizer).patch(url, {"status": "suspended"}, format="json").status_code == 403
        assert self.auth(self.organizer).delete(url).status_code == 403

    def test_admin_can_list_users(self):
        response = self.auth(self.admin).get(USERS_URL)
        assert response.status_code == 200
        assert response.data["count"] >= 4

    def test_filter_users_by_role(self):
        response = self.auth(self.admin).get(f"{USERS_URL}?role=trainer")
        assert response.status_code == 200
        assert all(u["role"] == "trainer" for u in response.data["results"])

    def test_filter_users_by_status(self):
        pending_user = UserFactory(pending=True)
        response = self.auth(self.admin).get(f"{USERS_URL}?status=pending")
        assert response.status_code == 200
        assert any(u["id"] == str(pending_user.id) for u in response.data["results"])

    def test_filter_users_by_is_active(self):
        inactive_user = UserFactory(suspended=True)
        response = self.auth(self.admin).get(f"{USERS_URL}?is_active=false")
        assert response.status_code == 200
        assert any(u["id"] == str(inactive_user.id) for u in response.data["results"])

    def test_search_users_by_email(self):
        special_user = UserFactory(email="special.search@test.fr")
        response = self.auth(self.admin).get(f"{USERS_URL}?search=special.search")
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["email"] == special_user.email

    def test_retrieve_user_detail(self):
        url = f"{USERS_URL}{self.learner.id}/"
        response = self.auth(self.admin).get(url)
        assert response.status_code == 200
        assert response.data["email"] == self.learner.email

    def test_partial_update_user(self):
        url = f"{USERS_URL}{self.learner.id}/"
        response = self.auth(self.admin).patch(
            url,
            {"role": "trainer", "phone_number": "+221771234567"},
            format="json",
        )
        assert response.status_code == 200
        self.learner.refresh_from_db()
        assert self.learner.role == User.Role.TRAINER
        assert self.learner.phone_number == "+221771234567"

    def test_admin_can_suspend_and_reactivate_user(self):
        url = f"{USERS_URL}{self.learner.id}/"
        # Suspend
        resp_suspend = self.auth(self.admin).patch(url, {"status": "suspended"}, format="json")
        assert resp_suspend.status_code == 200
        self.learner.refresh_from_db()
        assert self.learner.status == User.Status.SUSPENDED
        assert self.learner.is_active is False

        # Reactivate
        resp_active = self.auth(self.admin).patch(url, {"status": "active"}, format="json")
        assert resp_active.status_code == 200
        self.learner.refresh_from_db()
        assert self.learner.status == User.Status.ACTIVE
        assert self.learner.is_active is True

    def test_admin_cannot_delete_self(self):
        url = f"{USERS_URL}{self.admin.id}/"
        response = self.auth(self.admin).delete(url)
        assert response.status_code == 400

    def test_admin_can_delete_other_user(self):
        target = UserFactory()
        url = f"{USERS_URL}{target.id}/"
        response = self.auth(self.admin).delete(url)
        assert response.status_code == 204
        assert not User.objects.filter(pk=target.id).exists()

    def test_admin_can_create_active_user_directly(self):
        payload = {
            "email": "direct@test.fr",
            "password": "SecurePassword123!",
            "role": "trainer",
            "first_name": "Cheikh",
            "last_name": "Anta",
            "phone_number": "+221771234567",
        }
        response = self.auth(self.admin).post(USERS_URL, payload, format="json")
        assert response.status_code == 201
        assert response.data["email"] == "direct@test.fr"
        assert response.data["role"] == "trainer"
        assert response.data["status"] == "active"
        assert response.data["first_name"] == "Cheikh"
        assert response.data["last_name"] == "Anta"
        assert response.data["phone_number"] == "+221771234567"
        assert "password" not in response.data

        user = User.objects.get(email="direct@test.fr")
        assert user.status == User.Status.ACTIVE
        assert user.is_active is True
        assert user.check_password("SecurePassword123!")

        # L'utilisateur peut se connecter immédiatement sans reset ni activation
        login = self.post_json(
            f"{API_PREFIX}/auth/login/",
            {"email": "direct@test.fr", "password": "SecurePassword123!"},
        )
        assert login.status_code == 200
        assert "access" in login.json()

    def test_create_user_forbidden_for_non_admin(self):
        payload = {
            "email": "forbidden@test.fr",
            "password": "SecurePassword123!",
            "role": "learner",
        }
        # Non authentifié
        assert self.client.post(USERS_URL, payload, format="json").status_code == 401
        # Organisateur
        assert self.auth(self.organizer).post(USERS_URL, payload, format="json").status_code == 403
        # Formateur
        assert self.auth(self.trainer).post(USERS_URL, payload, format="json").status_code == 403
        # Apprenant
        assert self.auth(self.learner).post(USERS_URL, payload, format="json").status_code == 403

    def test_create_user_duplicate_email_rejected(self):
        payload = {
            "email": self.learner.email,
            "password": "SecurePassword123!",
            "role": "learner",
        }
        response = self.auth(self.admin).post(USERS_URL, payload, format="json")
        assert response.status_code == 400
        assert "email" in response.data

    def test_create_user_weak_password_rejected(self):
        payload = {
            "email": "weak@test.fr",
            "password": "123",
            "role": "learner",
        }
        response = self.auth(self.admin).post(USERS_URL, payload, format="json")
        assert response.status_code == 400
        assert "password" in response.data

