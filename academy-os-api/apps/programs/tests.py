import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.programs.models import Program

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@example.com",
        password="password123",
        role=User.Role.ADMIN,
    )


@pytest.fixture
def learner_user(db):
    return User.objects.create_user(
        email="learner@example.com",
        password="password123",
        role=User.Role.LEARNER,
    )


@pytest.fixture
def trainer_user(db):
    return User.objects.create_user(
        email="trainer@example.com",
        password="password123",
        role=User.Role.TRAINER,
    )


@pytest.fixture
def program(db):
    return Program.objects.create(
        title="Fullstack Python React",
        description="Programme complet de formation intensive.",
        status=Program.StatusProgramEnum.ACTIVE,
    )


@pytest.mark.django_db
class TestProgramPermissions:
    def test_unauthenticated_cannot_list_programs(self, api_client):
        response = api_client.get("/api/programs/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_learner_cannot_list_programs(self, api_client, learner_user):
        api_client.force_authenticate(user=learner_user)
        response = api_client.get("/api/programs/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_trainer_cannot_create_program(self, api_client, trainer_user):
        api_client.force_authenticate(user=trainer_user)
        data = {
            "title": "Data Engineering",
            "description": "Bootcamp Data",
            "status": "active",
        }
        response = api_client.post("/api/programs/", data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestProgramAdminCRUD:
    def test_admin_can_list_programs(self, api_client, admin_user, program):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/programs/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["title"] == program.title

    def test_admin_can_create_program(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        data = {
            "title": "DevOps & Cloud",
            "description": "Apprenez Docker, Kubernetes et AWS.",
            "status": "active",
        }
        response = api_client.post("/api/programs/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == data["title"]
        assert Program.objects.filter(title="DevOps & Cloud").exists()

    def test_admin_can_retrieve_program(self, api_client, admin_user, program):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f"/api/programs/{program.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(program.id)

    def test_admin_can_update_program(self, api_client, admin_user, program):
        api_client.force_authenticate(user=admin_user)
        data = {
            "title": "Fullstack Python Django React",
            "description": "Description mise à jour",
            "status": "inactive",
        }
        response = api_client.put(f"/api/programs/{program.id}/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        program.refresh_from_db()
        assert program.title == "Fullstack Python Django React"
        assert program.status == Program.StatusProgramEnum.INACTIVE

    def test_admin_can_delete_program(self, api_client, admin_user, program):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f"/api/programs/{program.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Program.objects.filter(id=program.id).exists()

