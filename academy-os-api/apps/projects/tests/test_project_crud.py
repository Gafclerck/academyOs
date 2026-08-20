"""Tests CRUD de l'API projets, filtres, pièces jointes et permissions."""

from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError

from apps.attachments.models import Attachment
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.programs.tests.factories import ProgramFactory

from ..models import Project
from .factories import ProjectFactory

PROJECTS_URL = "/api/v1/projects/"


class ProjectAdminCrudTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

    # Vérifie qu'un administrateur peut lister tous les projets (réponse paginée).
    def test_admin_can_list_projects(self):
        project = ProjectFactory()
        response = self.auth(self.admin).get(PROJECTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == project.title

    # Vérifie qu'un administrateur peut créer un projet avec programme, titre et ordre.
    def test_admin_can_create_project(self):
        program = ProgramFactory()
        data = {
            "program": str(program.id),
            "title": "Application web Django",
            "description": "Construire une API REST complète.",
            "status": "published",
            "order": 1,
        }
        response = self.auth(self.admin).post(PROJECTS_URL, data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == data["title"]
        assert response.data["order"] == 1
        assert response.data["status"] == "published"

    # Vérifie qu'un administrateur peut récupérer le détail d'un projet précis.
    def test_admin_can_retrieve_project(self):
        project = ProjectFactory()
        response = self.auth(self.admin).get(f"{PROJECTS_URL}{project.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(project.id)
        assert "attachments" in response.data

    # Vérifie qu'un administrateur peut modifier tous les champs d'un projet existant.
    def test_admin_can_update_project(self):
        project = ProjectFactory()
        data = {
            "program": str(project.program.id),
            "title": "Projet mis à jour",
            "description": "Description mise à jour",
            "status": "published",
            "order": project.order,
        }
        response = self.auth(self.admin).put(f"{PROJECTS_URL}{project.id}/", data, format="json")
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.title == "Projet mis à jour"
        assert project.status == "published"

    # Vérifie qu'un administrateur peut supprimer un projet et qu'il n'existe plus.
    def test_admin_can_delete_project(self):
        project = ProjectFactory()
        response = self.auth(self.admin).delete(f"{PROJECTS_URL}{project.id}/")
        assert response.status_code == 204
        assert not self.project_exists(project.id)

    # Vérifie la contrainte d'unicité : deux projets même programme + même ordre = erreur.
    def test_unique_constraint_per_program_and_order(self):
        project = ProjectFactory(order=1)
        with self.assertRaises(IntegrityError):
            Project.objects.create(
                program=project.program,
                title="Doublon",
                order=1,
            )

    # Vérifie le filtrage par programme
    def test_filter_projects_by_program(self):
        program1 = ProgramFactory()
        program2 = ProgramFactory()
        p1 = ProjectFactory(program=program1, order=1)
        ProjectFactory(program=program2, order=1)

        response = self.auth(self.admin).get(f"{PROJECTS_URL}?program={program1.id}")
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(p1.id)

    # Vérifie le rejet d'un UUID de programme invalide
    def test_filter_projects_by_invalid_uuid(self):
        response = self.auth(self.admin).get(f"{PROJECTS_URL}?program=invalid-uuid")
        assert response.status_code == 400
        assert "program" in response.data

    # Vérifie le filtrage par statut (draft / published)
    def test_filter_projects_by_status(self):
        ProjectFactory(status=Project.StatusProjectEnum.DRAFT)
        p2 = ProjectFactory(status=Project.StatusProjectEnum.PUBLISHED)

        response = self.auth(self.admin).get(f"{PROJECTS_URL}?status=published")
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(p2.id)

    # Vérifie la recherche par mot-clé sur le titre et la description
    def test_search_projects(self):
        p1 = ProjectFactory(title="Développement Backend API")
        ProjectFactory(title="Design UI/UX")

        response = self.auth(self.admin).get(f"{PROJECTS_URL}?search=Backend")
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == str(p1.id)

    # Vérifie l'ajout d'une pièce jointe à un projet via POST /projects/<id>/attachments/
    def test_admin_can_upload_attachment_to_project(self):
        project = ProjectFactory()
        file = SimpleUploadedFile("consignes.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")

        response = self.auth(self.admin).post(
            f"{PROJECTS_URL}{project.id}/attachments/",
            {"file": file},
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["original_filename"] == "consignes.pdf"

        # Vérifie que le projet retourne bien la pièce jointe
        detail_resp = self.auth(self.admin).get(f"{PROJECTS_URL}{project.id}/")
        assert len(detail_resp.data["attachments"]) == 1
        assert detail_resp.data["attachments"][0]["original_filename"] == "consignes.pdf"

    # Vérifie que la suppression d'un projet supprime en cascade ses pièces jointes
    def test_deleting_project_purges_attachments(self):
        project = ProjectFactory()
        file = SimpleUploadedFile("sujet.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")
        self.auth(self.admin).post(
            f"{PROJECTS_URL}{project.id}/attachments/",
            {"file": file},
            format="multipart",
        )
        assert Attachment.objects.filter(object_id=project.id).count() == 1

        # Suppression du projet
        self.auth(self.admin).delete(f"{PROJECTS_URL}{project.id}/")
        assert Attachment.objects.filter(object_id=project.id).count() == 0

    # Vérifie les permissions RBAC pour les rôles non-admin
    def test_non_admin_can_read_but_cannot_mutate(self):
        project = ProjectFactory()

        # Learner peut lire
        assert self.auth(self.learner).get(PROJECTS_URL).status_code == 200
        assert self.auth(self.learner).get(f"{PROJECTS_URL}{project.id}/").status_code == 200

        # Learner ne peut pas créer, modifier, supprimer ou téléverser
        assert self.auth(self.learner).post(PROJECTS_URL, {"title": "X"}, format="json").status_code == 403
        assert self.auth(self.learner).put(f"{PROJECTS_URL}{project.id}/", {"title": "X"}, format="json").status_code == 403
        assert self.auth(self.learner).delete(f"{PROJECTS_URL}{project.id}/").status_code == 403

        file = SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf")
        assert self.auth(self.learner).post(
            f"{PROJECTS_URL}{project.id}/attachments/",
            {"file": file},
            format="multipart",
        ).status_code == 403

    def test_unauthenticated_cannot_access(self):
        project = ProjectFactory()
        assert self.client.get(PROJECTS_URL).status_code == 401
        assert self.client.get(f"{PROJECTS_URL}{project.id}/").status_code == 401

    @staticmethod
    def project_exists(project_id):
        return Project.objects.filter(id=project_id).exists()
