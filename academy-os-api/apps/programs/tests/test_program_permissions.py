from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory

PROGRAMS_URL = "/api/programs/"


class ProgramPermissionTests(AuthAPITestCase):
    def test_unauthenticated_cannot_list_programs(self):
        assert self.client.get(PROGRAMS_URL).status_code == 401

    def test_learner_cannot_list_programs(self):
        learner = UserFactory()
        response = self.auth(learner).get(PROGRAMS_URL)
        assert response.status_code == 403

    def test_trainer_cannot_create_program(self):
        trainer = UserFactory(trainer=True)
        data = {
            "title": "Data Engineering",
            "description": "Bootcamp Data",
            "status": "active",
        }
        response = self.auth(trainer).post(PROGRAMS_URL, data, format="json")
        assert response.status_code == 403