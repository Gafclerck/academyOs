from decimal import Decimal
from rest_framework import status

from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import EvaluationCriterion
from apps.projects.tests.factories import ProjectFactory

from .factories import EvaluationCriterionFactory


class EvaluationCriteriaAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)
        self.organizer = UserFactory(organizer=True)
        self.trainer = UserFactory(trainer=True)
        self.learner = UserFactory()

        self.project = ProjectFactory()
        self.criterion = EvaluationCriterionFactory(
            project=self.project,
            title="Architecture",
            competency_name="Backend",
            max_score=Decimal("20.00"),
            weight=Decimal("1.50"),
            order=1,
        )

    def test_list_criteria_authenticated(self):
        self.auth(self.learner)
        res = self.client.get("/api/v1/criteria/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["title"], "Architecture")

    def test_filter_criteria_by_project(self):
        other_project = ProjectFactory()
        EvaluationCriterionFactory(project=other_project, title="Other", order=1)

        self.auth(self.trainer)
        res = self.client.get(f"/api/v1/criteria/?project={self.project.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["id"], str(self.criterion.id))

    def test_create_criterion_admin_success(self):
        self.auth(self.admin)
        payload = {
            "project": str(self.project.id),
            "title": "Tests unitaires",
            "description": "Couverture de test >= 80%",
            "competency_name": "Quality Assurance",
            "max_score": "20.00",
            "weight": "2.00",
            "order": 2,
        }
        res = self.post_json("/api/v1/criteria/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EvaluationCriterion.objects.filter(title="Tests unitaires").exists())

    def test_create_criterion_learner_forbidden(self):
        self.auth(self.learner)
        payload = {
            "project": str(self.project.id),
            "title": "Hacking",
            "order": 3,
        }
        res = self.post_json("/api/v1/criteria/", payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_criterion_admin(self):
        self.auth(self.admin)
        res = self.patch_json(f"/api/v1/criteria/{self.criterion.id}/", {"title": "Nouvelle Architecture"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.criterion.refresh_from_db()
        self.assertEqual(self.criterion.title, "Nouvelle Architecture")

    def test_delete_criterion_admin(self):
        self.auth(self.admin)
        res = self.client.delete(f"/api/v1/criteria/{self.criterion.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(EvaluationCriterion.objects.filter(id=self.criterion.id).exists())
