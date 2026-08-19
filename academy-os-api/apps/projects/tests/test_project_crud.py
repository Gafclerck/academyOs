"""Tests CRUD de l'API projets et contrainte d'unicité."""

from django.db import IntegrityError

from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

from .factories import ProjectFactory

PROJECTS_URL = "/api/v1/projects/"


class ProjectAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_admin_can_list_projects(self):
        project = ProjectFactory()
        response = self.auth(self.admin).get(PROJECTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == project.title

    def test_admin_can_create_project(self):
        from apps.programs.tests.factories import ProgramFactory

        program = ProgramFactory()
        data = {
            "program": str(program.id),
            "title": "Application web Django",
            "description": "Construire une API REST complète.",
            "ordre": 1,
        }
        response = self.auth(self.admin).post(PROJECTS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == data["title"]

    def test_admin_can_retrieve_project(self):
        project = ProjectFactory()
        response = self.auth(self.admin).get(f"{PROJECTS_URL}{project.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(project.id)

    def test_admin_can_update_project(self):
        project = ProjectFactory()
        data = {
            "program": str(project.program.id),
            "title": "Projet mis à jour",
            "description": "Description mise à jour",
            "ordre": project.ordre,
        }
        response = self.auth(self.admin).put(f"{PROJECTS_URL}{project.id}/", data, format="json")
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.title == "Projet mis à jour"

    def test_admin_can_delete_project(self):
        project = ProjectFactory()
        response = self.auth(self.admin).delete(f"{PROJECTS_URL}{project.id}/")
        assert response.status_code == 204
        assert not self.project_exists(project.id)

    def test_unique_constraint_per_program_and_order(self):
        from apps.projects.models import Project

        project = ProjectFactory(ordre=1)
        with self.assertRaises(IntegrityError):
            Project.objects.create(
                program=project.program,
                title="Doublon",
                ordre=1,
            )

    @staticmethod
    def project_exists(project_id):
        from apps.projects.models import Project

        return Project.objects.filter(id=project_id).exists()
