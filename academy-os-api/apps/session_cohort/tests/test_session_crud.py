from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.session_cohort.models import Session

from .factories import SessionFactory

SESSIONS_URL = "/api/cohort-sessions/"


class SessionAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_admin_can_list_sessions(self):
        session = SessionFactory()
        response = self.auth(self.admin).get(SESSIONS_URL)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["start_date"] == str(session.start_date)

    def test_admin_can_create_session(self):
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-12-01",
            "status": "en_cours",
        }
        response = self.auth(self.admin).post(SESSIONS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["start_date"] == data["start_date"]
        assert response.data["end_date"] == data["end_date"]
        assert response.data["status"] == "en_cours"
        assert Session.objects.filter(start_date="2026-09-01").exists()

    def test_admin_can_retrieve_session(self):
        session = SessionFactory()
        response = self.auth(self.admin).get(f"{SESSIONS_URL}{session.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(session.id)

    def test_admin_can_update_session(self):
        session = SessionFactory()
        data = {
            "start_date": "2026-10-01",
            "end_date": "2026-12-15",
            "status": "termine",
        }
        response = self.auth(self.admin).put(f"{SESSIONS_URL}{session.id}/", data, format="json")
        assert response.status_code == 200
        session.refresh_from_db()
        assert str(session.start_date) == "2026-10-01"
        assert str(session.end_date) == "2026-12-15"
        assert session.status == Session.StatusEnum.TERMINE

    def test_admin_can_delete_session(self):
        session = SessionFactory()
        response = self.auth(self.admin).delete(f"{SESSIONS_URL}{session.id}/")
        assert response.status_code == 204
        assert not Session.objects.filter(id=session.id).exists()

    def test_end_date_before_start_date_rejected(self):
        data = {
            "start_date": "2026-12-01",
            "end_date": "2026-09-01",
            "status": "a_venir",
        }
        response = self.auth(self.admin).post(SESSIONS_URL, data, format="json")
        assert response.status_code == 400

    def test_end_date_equal_start_date_rejected(self):
        data = {
            "start_date": "2026-09-01",
            "end_date": "2026-09-01",
            "status": "a_venir",
        }
        response = self.auth(self.admin).post(SESSIONS_URL, data, format="json")
        assert response.status_code == 400