import factory
from django.utils import timezone

from apps.cohorts.tests.factories import EnrollmentFactory
from apps.core.tests.factories import UserFactory
from apps.evaluations.models import Deliverable, ProjectAssignment
from apps.projects.tests.factories import ProjectFactory


class ProjectAssignmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectAssignment

    enrollment = factory.SubFactory(EnrollmentFactory)
    project = factory.SubFactory(ProjectFactory)
    status = ProjectAssignment.StatusEnum.PENDING
    assigned_at = factory.LazyFunction(timezone.now)


class DeliverableFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Deliverable

    assignment = factory.SubFactory(ProjectAssignmentFactory)
    version = 1
    submitted_by = factory.LazyAttribute(lambda o: o.assignment.enrollment.user)
    submitted_at = factory.LazyFunction(timezone.now)
    repo_url = "https://github.com/student/mon-projet"
    live_url = "https://mon-projet.vercel.app"
    comments = "Version initiale du livrable."
    status = Deliverable.StatusEnum.SUBMITTED
