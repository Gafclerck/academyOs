"""Tests du mécanisme de suppression logique (Soft Delete).

Couvre :
- Soft delete unitaire et en lot
- Filtrage automatique des QuerySets (objects.all() vs all_objects vs deleted_objects)
- Propriété is_deleted et méthode restore()
- Suppression définitive (hard_delete)
- Réutilisation des contraintes d'unicité partielles (ex: Program.title, Project order)
- Comportement des endpoints d'API DRF (DELETE 204, GET 404/exclus de la liste)
- Soft delete des utilisateurs (archivage automatique et désactivation)
"""

from django.utils import timezone
from rest_framework import status

from apps.cohorts.models import Cohort, Enrollment, Intake, TrainerAssignment
from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory, IntakeFactory, TrainerAssignmentFactory
from apps.core.tests.base import API_PREFIX, AuthAPITestCase, AuthTestCase
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import Deliverable, EvaluationCriterion, ProjectAssignment
from apps.evaluations.tests.factories import EvaluationCriterionFactory, ProjectAssignmentFactory
from apps.programs.models import Program
from apps.programs.tests.factories import ProgramFactory
from apps.projects.models import Project
from apps.projects.tests.factories import ProjectFactory
from apps.users.models import User


class SoftDeleteModelTests(AuthTestCase):
    def test_soft_delete_sets_deleted_at(self):
        program = ProgramFactory(title="Data Engineering")
        assert program.deleted_at is None
        assert not program.is_deleted

        program.delete()
        program.refresh_from_db()

        assert program.deleted_at is not None
        assert program.is_deleted

    def test_default_manager_excludes_deleted_objects(self):
        p1 = ProgramFactory(title="Dev Backend")
        p2 = ProgramFactory(title="Dev Frontend")

        p1.delete()

        active_programs = list(Program.objects.all())
        assert p2 in active_programs
        assert p1 not in active_programs
        assert Program.objects.filter(id=p1.id).count() == 0

    def test_all_objects_manager_includes_deleted(self):
        program = ProgramFactory(title="Cybersecurity")
        program.delete()

        assert Program.all_objects.filter(id=program.id).exists()
        assert Program.all_objects.get(id=program.id).deleted_at is not None

    def test_deleted_objects_manager_returns_only_deleted(self):
        p1 = ProgramFactory(title="Active AI")
        p2 = ProgramFactory(title="Deleted AI")
        p2.delete()

        deleted_list = list(Program.deleted_objects.all())
        assert p2 in deleted_list
        assert p1 not in deleted_list

    def test_restore_clears_deleted_at(self):
        program = ProgramFactory(title="DevOps Master")
        program.delete()
        assert not Program.objects.filter(id=program.id).exists()

        program.restore()
        program.refresh_from_db()

        assert program.deleted_at is None
        assert not program.is_deleted
        assert Program.objects.filter(id=program.id).exists()

    def test_hard_delete_permanently_removes_record(self):
        program = ProgramFactory(title="Temporary Plan")
        program_id = program.id

        program.hard_delete()

        assert not Program.objects.filter(id=program_id).exists()
        assert not Program.all_objects.filter(id=program_id).exists()

    def test_bulk_soft_delete_and_restore(self):
        p1 = ProgramFactory(title="Bulk 1")
        p2 = ProgramFactory(title="Bulk 2")
        p3 = ProgramFactory(title="Bulk 3")

        # Soft delete en lot
        Program.objects.filter(title__startswith="Bulk").delete()

        assert Program.objects.filter(title__startswith="Bulk").count() == 0
        assert Program.all_objects.filter(title__startswith="Bulk").count() == 3
        assert Program.deleted_objects.filter(title__startswith="Bulk").count() == 3

        # Restauration en lot
        Program.all_objects.filter(title__startswith="Bulk").restore()
        assert Program.objects.filter(title__startswith="Bulk").count() == 3

    def test_unique_constraint_allows_reuse_after_soft_delete(self):
        """Un titre de programme supprimé logiquement peut être réutilisé pour un nouveau programme actif."""
        title = "Unique Master Program"
        p1 = ProgramFactory(title=title)
        p1.delete()

        # Doit réussir sans lever d'IntegrityError car le premier est soft-deleted
        p2 = Program.objects.create(
            title=title,
            description="Nouvelle version du programme",
            status=Program.StatusProgramEnum.ACTIVE,
        )
        assert p2.id != p1.id
        assert Program.objects.filter(title=title).count() == 1
        assert Program.all_objects.filter(title=title).count() == 2

    def test_project_order_unique_constraint_with_soft_delete(self):
        """Un ordre de projet supprimé logiquement dans un programme peut être réutilisé."""
        program = ProgramFactory(title="Architecture Logicielle")
        proj1 = ProjectFactory(program=program, order=1, title="Projet 1 V1")
        proj1.delete()

        # Doit pouvoir recréer un projet d'ordre 1 dans le même programme
        proj2 = Project.objects.create(
            program=program,
            title="Projet 1 V2",
            order=1,
        )
        assert proj2.id != proj1.id
        assert Project.objects.filter(program=program, order=1).count() == 1

    def test_user_soft_delete_sets_status_and_is_active(self):
        user = UserFactory(email="soft.delete@user.com", trainer=True)
        assert user.is_active is True
        assert user.status == User.Status.ACTIVE
        assert user.deleted_at is None

        user.delete()
        user.refresh_from_db()

        assert user.deleted_at is not None
        assert user.is_deleted is True
        assert user.is_active is False
        assert user.status == User.Status.ARCHIVED
        assert not User.objects.filter(id=user.id).exists()
        assert User.all_objects.filter(id=user.id).exists()

        # Restauration
        user.restore()
        user.refresh_from_db()
        assert user.deleted_at is None
        assert user.is_active is True
        assert user.status == User.Status.ACTIVE
        assert User.objects.filter(id=user.id).exists()


class SoftDeleteAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(admin=True)

    def test_delete_program_endpoint_performs_soft_delete(self):
        program = ProgramFactory(title="API Soft Delete Test")
        url = f"{API_PREFIX}/programs/{program.id}/"

        # DELETE HTTP 204
        delete_response = self.auth(self.admin).delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # N'apparaît plus dans GET /api/v1/programs/
        list_response = self.auth(self.admin).get(f"{API_PREFIX}/programs/")
        assert list_response.status_code == status.HTTP_200_OK
        assert all(p["id"] != str(program.id) for p in list_response.data["results"])

        # GET /api/v1/programs/<id>/ renvoie 404
        detail_response = self.auth(self.admin).get(url)
        assert detail_response.status_code == status.HTTP_404_NOT_FOUND

        # Existe toujours dans la base avec deleted_at
        program.refresh_from_db()
        assert program.deleted_at is not None
        assert Program.all_objects.filter(id=program.id).exists()

    def test_delete_project_endpoint_performs_soft_delete(self):
        project = ProjectFactory()
        url = f"{API_PREFIX}/projects/{project.id}/"

        delete_response = self.auth(self.admin).delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # 404 sur le détail
        assert self.auth(self.admin).get(url).status_code == status.HTTP_404_NOT_FOUND

        # En base toujours présent avec deleted_at
        assert Project.all_objects.filter(id=project.id).exists()
        assert Project.all_objects.get(id=project.id).deleted_at is not None

    def test_delete_cohort_endpoint_performs_soft_delete(self):
        cohort = CohortFactory()
        url = f"{API_PREFIX}/cohorts/{cohort.id}/"

        delete_response = self.auth(self.admin).delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        assert not Cohort.objects.filter(id=cohort.id).exists()
        assert Cohort.all_objects.filter(id=cohort.id).exists()
        assert Cohort.all_objects.get(id=cohort.id).deleted_at is not None

    def test_delete_user_endpoint_performs_soft_delete(self):
        target_user = UserFactory()
        url = f"{API_PREFIX}/users/{target_user.id}/"

        delete_response = self.auth(self.admin).delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Ne peut plus être récupéré via User.objects
        assert not User.objects.filter(id=target_user.id).exists()

        # Présent dans all_objects avec deleted_at et désactivé
        target_user.refresh_from_db()
        assert target_user.deleted_at is not None
        assert target_user.is_active is False
        assert target_user.status == User.Status.ARCHIVED

