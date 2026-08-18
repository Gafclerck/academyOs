"""Tests des filtres et de la pagination sur l'endpoint des cohortes."""

from uuid import uuid4

from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.programs.models import Program

from .factories import CohortFactory, IntakeFactory

COHORTS_URL = f"{API_PREFIX}/cohorts/"


class CohortFilterTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_filter_by_intake(self):
        intake_a = IntakeFactory()
        intake_b = IntakeFactory()
        cohort_a1 = CohortFactory(intake=intake_a)
        cohort_a2 = CohortFactory(intake=intake_a)
        CohortFactory(intake=intake_b)
        response = self.auth(self.admin).get(
            COHORTS_URL, {"intake": str(intake_a.id)}
        )
        assert response.status_code == 200
        assert response.data["count"] == 2
        assert {c["id"] for c in response.data["results"]} == {
            str(cohort_a1.id),
            str(cohort_a2.id),
        }

    def test_filter_by_program(self):
        program_a = Program.objects.create(title="Programme A")
        program_b = Program.objects.create(title="Programme B")
        cohort_a1 = CohortFactory(program=program_a)
        cohort_a2 = CohortFactory(program=program_a)
        CohortFactory(program=program_b)
        response = self.auth(self.admin).get(
            COHORTS_URL, {"program": str(program_a.id)}
        )
        assert response.status_code == 200
        assert response.data["count"] == 2
        assert {c["id"] for c in response.data["results"]} == {
            str(cohort_a1.id),
            str(cohort_a2.id),
        }

    def test_combined_filters(self):
        intake_a = IntakeFactory()
        intake_b = IntakeFactory()
        program_a = Program.objects.create(title="Programme A")
        program_b = Program.objects.create(title="Programme B")
        CohortFactory(intake=intake_a, program=program_a)
        CohortFactory(intake=intake_a, program=program_b)
        CohortFactory(intake=intake_b, program=program_a)
        response = self.auth(self.admin).get(
            COHORTS_URL,
            {"intake": str(intake_a.id), "program": str(program_a.id)},
        )
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_invalid_uuid_rejected(self):
        response = self.auth(self.admin).get(COHORTS_URL, {"intake": "pas-un-uuid"})
        assert response.status_code == 400
        response = self.auth(self.admin).get(COHORTS_URL, {"program": "pas-un-uuid"})
        assert response.status_code == 400

    def test_unknown_uuid_returns_empty(self):
        response = self.auth(self.admin).get(COHORTS_URL, {"intake": str(uuid4())})
        assert response.status_code == 200
        assert response.data["count"] == 0


class CohortPaginationTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_default_page_size(self):
        CohortFactory.create_batch(25)
        response = self.auth(self.admin).get(COHORTS_URL)
        assert response.status_code == 200
        assert response.data["count"] == 25
        assert len(response.data["results"]) == 20
        assert response.data["next"] is not None
        assert response.data["previous"] is None

    def test_second_page(self):
        CohortFactory.create_batch(25)
        response = self.auth(self.admin).get(COHORTS_URL, {"page": "2"})
        assert response.status_code == 200
        assert len(response.data["results"]) == 5
        assert response.data["previous"] is not None
        assert response.data["next"] is None

    def test_custom_page_size(self):
        CohortFactory.create_batch(25)
        response = self.auth(self.admin).get(COHORTS_URL, {"page_size": "5"})
        assert response.status_code == 200
        assert len(response.data["results"]) == 5

    def test_page_size_capped_at_max(self):
        CohortFactory.create_batch(120)
        response = self.auth(self.admin).get(COHORTS_URL, {"page_size": "200"})
        assert response.status_code == 200
        assert len(response.data["results"]) == 100