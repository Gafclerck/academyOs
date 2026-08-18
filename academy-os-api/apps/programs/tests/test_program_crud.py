from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.programs.models import Program

from .factories import ProgramFactory

PROGRAMS_URL = f"{API_PREFIX}/programs/"


class ProgramAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_admin_can_list_programs(self):
        program = ProgramFactory()
        response = self.auth(self.admin).get(PROGRAMS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == program.title

    def test_admin_can_create_program(self):
        data = {
            "title": "DevOps & Cloud",
            "description": "Apprenez Docker, Kubernetes et AWS.",
            "status": "active",
        }
        response = self.auth(self.admin).post(PROGRAMS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == data["title"]
        assert Program.objects.filter(title="DevOps & Cloud").exists()

    def test_admin_can_retrieve_program(self):
        program = ProgramFactory()
        response = self.auth(self.admin).get(f"{PROGRAMS_URL}{program.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(program.id)

    def test_admin_can_update_program(self):
        program = ProgramFactory()
        data = {
            "title": "Fullstack Python Django React",
            "description": "Description mise à jour",
            "status": "inactive",
        }
        response = self.auth(self.admin).put(f"{PROGRAMS_URL}{program.id}/", data, format="json")
        assert response.status_code == 200
        program.refresh_from_db()
        assert program.title == "Fullstack Python Django React"
        assert program.status == Program.StatusProgramEnum.INACTIVE

    def test_admin_can_delete_program(self):
        program = ProgramFactory()
        response = self.auth(self.admin).delete(f"{PROGRAMS_URL}{program.id}/")
        assert response.status_code == 204
        assert not Program.objects.filter(id=program.id).exists()