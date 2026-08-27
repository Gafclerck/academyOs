"""Tests de l'app claims : création, traitement, permissions, notifications."""

from django.core.exceptions import PermissionDenied
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.cohorts.models import Enrollment
from apps.cohorts.tests.factories import EnrollmentFactory
from apps.claims.models import Claim
from apps.claims.services import create_claim, update_claim_status
from apps.claims.tests.factories import ClaimFactory
from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.notifications.models import Notification
from apps.notifications.services import get_unread_count
from apps.users.models import User

CLAIMS_URL = "/api/v1/claims/"


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────


def _make_enrollment(learner=None, status=Enrollment.StatusEnum.COMPLETED, cohort=None):
    """Crée une inscription terminée avec un learner."""
    if learner is None:
        learner = UserFactory()
    kwargs = {"user": learner, "status": status}
    if cohort is not None:
        kwargs["cohort"] = cohort
    enrollment = EnrollmentFactory(**kwargs)
    return enrollment, learner


def _make_certificate(enrollment=None, status="EN_ATTENTE"):
    """Crée un certificat lié à une inscription."""
    from apps.certificates.models import Certificate

    if enrollment is None:
        enrollment, _ = _make_enrollment()
    return Certificate.objects.create(
        inscription=enrollment,
        status=status,
    )


# ─────────────────────────────────────────────────────────────────────────────
# TESTS SERVICES
# ─────────────────────────────────────────────────────────────────────────────


class ClaimServiceCreateTests(TestCase):
    """Tests unitaires du service create_claim."""

    def test_create_claim_valid(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Mon certificat n'est pas envoyé.")
        self.assertEqual(claim.learner, learner)
        self.assertEqual(claim.certificate, certificate)
        self.assertEqual(claim.status, Claim.StatusEnum.PENDING)
        self.assertEqual(claim.message, "Mon certificat n'est pas envoyé.")

    def test_create_claim_notifies_admins_and_organizers(self):
        admin = UserFactory(role=User.Role.ADMIN)
        organizer = UserFactory(role=User.Role.ORGANIZER)
        trainer = UserFactory(role=User.Role.TRAINER)
        learner_user = UserFactory(role=User.Role.LEARNER)
        enrollment, _ = _make_enrollment(learner_user)
        certificate = _make_certificate(enrollment)

        create_claim(learner_user, certificate.id, "Problème")

        self.assertEqual(Notification.objects.filter(recipient=admin).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=organizer).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=trainer).count(), 0)

    def test_create_claim_wrong_learner(self):
        enrollment, owner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        other = UserFactory()

        with self.assertRaises(PermissionDenied):
            create_claim(other, certificate.id, "Arnaque")

    def test_create_claim_enrollment_not_completed(self):
        enrollment, learner = _make_enrollment(status=Enrollment.StatusEnum.ACTIVE)
        certificate = _make_certificate(enrollment)

        with self.assertRaises(ValidationError):
            create_claim(learner, certificate.id, "Trop tôt")

    def test_create_claim_certificate_already_sent(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment, status="ENVOYE")

        with self.assertRaises(ValidationError):
            create_claim(learner, certificate.id, "Déjà reçu")

    def test_create_claim_duplicate_active(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        create_claim(learner, certificate.id, "Première réclamation")

        with self.assertRaises(ValidationError):
            create_claim(learner, certificate.id, "Deuxième réclamation")

    def test_create_claim_after_resolved(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        admin = UserFactory(role=User.Role.ADMIN)
        claim = create_claim(learner, certificate.id, "Première")
        update_claim_status(claim, Claim.StatusEnum.IN_PROGRESS, handled_by=admin)
        update_claim_status(claim, Claim.StatusEnum.RESOLVED, handled_by=admin)
        claim2 = create_claim(learner, certificate.id, "Deuxième après résolution")
        self.assertEqual(claim2.status, Claim.StatusEnum.PENDING)

    def test_create_claim_nonexistent_certificate(self):
        learner = UserFactory()

        with self.assertRaises(ValidationError):
            create_claim(learner, "00000000-0000-0000-0000-000000000000", "Inexistant")


class ClaimServiceUpdateTests(TestCase):
    """Tests unitaires du service update_claim_status."""

    def setUp(self):
        self.enrollment, self.learner = _make_enrollment()
        self.certificate = _make_certificate(self.enrollment)
        self.admin = UserFactory(role=User.Role.ADMIN)
        self.claim = create_claim(self.learner, self.certificate.id, "Problème")

    def test_pending_to_in_progress(self):
        updated = update_claim_status(
            self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin
        )
        self.assertEqual(updated.status, Claim.StatusEnum.IN_PROGRESS)
        self.assertEqual(updated.handled_by, self.admin)
        self.assertIsNotNone(updated.handled_at)

    def test_in_progress_to_resolved(self):
        update_claim_status(self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin)
        updated = update_claim_status(
            self.claim, Claim.StatusEnum.RESOLVED, admin_response="Corrigé", handled_by=self.admin
        )
        self.assertEqual(updated.status, Claim.StatusEnum.RESOLVED)
        self.assertEqual(updated.admin_response, "Corrigé")

    def test_in_progress_to_rejected(self):
        update_claim_status(self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin)
        updated = update_claim_status(
            self.claim, Claim.StatusEnum.REJECTED, admin_response="Non fondé", handled_by=self.admin
        )
        self.assertEqual(updated.status, Claim.StatusEnum.REJECTED)

    def test_invalid_transition_pending_to_resolved(self):
        with self.assertRaises(ValidationError):
            update_claim_status(self.claim, Claim.StatusEnum.RESOLVED, handled_by=self.admin)

    def test_reopen_rejected(self):
        update_claim_status(self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin)
        update_claim_status(self.claim, Claim.StatusEnum.REJECTED, handled_by=self.admin)
        updated = update_claim_status(
            self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin
        )
        self.assertEqual(updated.status, Claim.StatusEnum.IN_PROGRESS)

    def test_update_notifies_learner(self):
        update_claim_status(self.claim, Claim.StatusEnum.IN_PROGRESS, handled_by=self.admin)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.learner,
                notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            ).exists()
        )


# ─────────────────────────────────────────────────────────────────────────────
# TESTS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────


class ClaimCreateEndpointTests(AuthAPITestCase):
    """Tests POST /api/v1/claims/"""

    def test_learner_can_create_claim(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        self.auth(learner)
        resp = self.post_json(CLAIMS_URL, {
            "certificate": str(certificate.id),
            "message": "Mon certificat n'a pas été envoyé.",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], "pending")
        self.assertEqual(resp.data["learner_email"], learner.email)

    def test_admin_cannot_create_claim(self):
        admin = UserFactory(role=User.Role.ADMIN)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        self.auth(admin)
        resp = self.post_json(CLAIMS_URL, {
            "certificate": str(certificate.id),
            "message": "Test",
        })
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_cannot_create_claim(self):
        enrollment, _ = _make_enrollment()
        certificate = _make_certificate(enrollment)
        resp = self.client.post(CLAIMS_URL, {
            "certificate": str(certificate.id),
            "message": "Test",
        }, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_create_claim_ineligible_certificate(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment, status="ENVOYE")
        self.auth(learner)
        resp = self.post_json(CLAIMS_URL, {
            "certificate": str(certificate.id),
            "message": "Déjà envoyé normalement",
        })
        self.assertEqual(resp.status_code, 400)


class ClaimListEndpointTests(AuthAPITestCase):
    """Tests GET /api/v1/claims/ et /api/v1/claims/me/"""

    def test_learner_lists_own_claims(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        create_claim(learner, certificate.id, "Réclamation")
        other_enrollment, other_learner = _make_enrollment()
        other_cert = _make_certificate(other_enrollment)
        create_claim(other_learner, other_cert.id, "Autre")
        self.auth(learner)
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)

    def test_admin_lists_all_claims(self):
        admin = UserFactory(role=User.Role.ADMIN)
        enrollment1, learner1 = _make_enrollment()
        cert1 = _make_certificate(enrollment1)
        enrollment2, learner2 = _make_enrollment()
        cert2 = _make_certificate(enrollment2)
        create_claim(learner1, cert1.id, "Réclamation 1")
        create_claim(learner2, cert2.id, "Réclamation 2")
        self.auth(admin)
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 2)

    def test_organizer_lists_all_claims(self):
        org = UserFactory(role=User.Role.ORGANIZER)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        create_claim(learner, certificate.id, "Réclamation")
        self.auth(org)
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)

    def test_filter_by_status(self):
        admin = UserFactory(role=User.Role.ADMIN)
        enrollment1, learner1 = _make_enrollment()
        cert1 = _make_certificate(enrollment1)
        enrollment2, learner2 = _make_enrollment()
        cert2 = _make_certificate(enrollment2)
        create_claim(learner1, cert1.id, "Réclamation 1")
        c2 = create_claim(learner2, cert2.id, "Réclamation 2")
        update_claim_status(c2, Claim.StatusEnum.IN_PROGRESS, handled_by=admin)
        self.auth(admin)
        resp = self.client.get(f"{CLAIMS_URL}?status=pending")
        self.assertEqual(resp.data["count"], 1)
        resp = self.client.get(f"{CLAIMS_URL}?status=in_progress")
        self.assertEqual(resp.data["count"], 1)

    def test_unauthenticated_cannot_list(self):
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 401)


class ClaimDetailEndpointTests(AuthAPITestCase):
    """Tests GET /api/v1/claims/<uuid>/"""

    def test_learner_can_view_own_claim(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        self.auth(learner)
        resp = self.client.get(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["id"], str(claim.id))

    def test_learner_cannot_view_other_claim(self):
        enrollment1, learner1 = _make_enrollment()
        cert1 = _make_certificate(enrollment1)
        claim1 = create_claim(learner1, cert1.id, "Réclamation 1")
        _, learner2 = _make_enrollment()
        self.auth(learner2)
        resp = self.client.get(f"{CLAIMS_URL}{claim1.id}/")
        self.assertIn(resp.status_code, [403, 404])

    def test_admin_can_view_any_claim(self):
        admin = UserFactory(role=User.Role.ADMIN)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        self.auth(admin)
        resp = self.client.get(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 200)


class ClaimUpdateEndpointTests(AuthAPITestCase):
    """Tests PATCH /api/v1/claims/<uuid>/"""

    def setUp(self):
        self.enrollment, self.learner = _make_enrollment()
        self.certificate = _make_certificate(self.enrollment)
        self.claim = create_claim(self.learner, self.certificate.id, "Problème")
        self.admin = UserFactory(role=User.Role.ADMIN)

    def test_admin_can_update_status(self):
        self.auth(self.admin)
        resp = self.patch_json(f"{CLAIMS_URL}{self.claim.id}/", {
            "status": "in_progress",
            "admin_response": "Nous examinons votre demande.",
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "in_progress")
        self.assertEqual(resp.data["admin_response"], "Nous examinons votre demande.")
        self.assertEqual(resp.data["handled_by_email"], self.admin.email)

    def test_organizer_can_update_status(self):
        org = UserFactory(role=User.Role.ORGANIZER)
        self.auth(org)
        resp = self.patch_json(f"{CLAIMS_URL}{self.claim.id}/", {
            "status": "in_progress",
        })
        self.assertEqual(resp.status_code, 200)

    def test_learner_cannot_update_status(self):
        self.auth(self.learner)
        resp = self.patch_json(f"{CLAIMS_URL}{self.claim.id}/", {
            "status": "in_progress",
        })
        self.assertEqual(resp.status_code, 403)

    def test_invalid_transition_returns_400(self):
        self.auth(self.admin)
        resp = self.patch_json(f"{CLAIMS_URL}{self.claim.id}/", {
            "status": "resolved",
        })
        self.assertEqual(resp.status_code, 400)

    def test_update_creates_notification_for_learner(self):
        self.auth(self.admin)
        self.patch_json(f"{CLAIMS_URL}{self.claim.id}/", {
            "status": "in_progress",
        })
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.learner,
                notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            ).exists()
        )


class ClaimDeleteEndpointTests(AuthAPITestCase):
    """Tests DELETE /api/v1/claims/<uuid>/"""

    def test_learner_can_delete_own_pending_claim(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        self.assertEqual(claim.status, Claim.StatusEnum.PENDING)
        self.auth(learner)
        resp = self.client.delete(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Claim.objects.filter(pk=claim.id).exists())

    def test_learner_cannot_delete_in_progress_claim(self):
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        admin = UserFactory(role=User.Role.ADMIN)
        update_claim_status(claim, Claim.StatusEnum.IN_PROGRESS, handled_by=admin)
        self.auth(learner)
        resp = self.client.delete(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 403)

    def test_learner_cannot_delete_others_claim(self):
        enrollment1, learner1 = _make_enrollment()
        cert1 = _make_certificate(enrollment1)
        claim1 = create_claim(learner1, cert1.id, "Réclamation")
        _, learner2 = _make_enrollment()
        self.auth(learner2)
        resp = self.client.delete(f"{CLAIMS_URL}{claim1.id}/")
        self.assertIn(resp.status_code, [403, 404])

    def test_admin_can_delete_any_claim(self):
        admin = UserFactory(role=User.Role.ADMIN)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        self.auth(admin)
        resp = self.client.delete(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 204)

    def test_trainer_cannot_delete_claim(self):
        trainer = UserFactory(trainer=True)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")
        self.auth(trainer)
        resp = self.client.delete(f"{CLAIMS_URL}{claim.id}/")
        self.assertEqual(resp.status_code, 403)


class ClaimTrainerAccessTests(AuthAPITestCase):
    """Tests trainer read access to claims."""

    def test_trainer_can_list_claims_in_assigned_cohort(self):
        from apps.cohorts.tests.factories import CohortFactory, TrainerAssignmentFactory

        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        enrollment, learner = _make_enrollment(cohort=cohort)
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")

        self.auth(trainer)
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)

    def test_trainer_cannot_see_claims_in_other_cohorts(self):
        from apps.cohorts.tests.factories import CohortFactory, EnrollmentFactory, TrainerAssignmentFactory

        trainer = UserFactory(trainer=True)
        my_cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=my_cohort)
        other_cohort = CohortFactory()
        enrollment, learner = _make_enrollment()
        # Enroll learner in other_cohort, not my_cohort
        EnrollmentFactory(user=learner, cohort=other_cohort)
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")

        self.auth(trainer)
        resp = self.client.get(CLAIMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 0)

    def test_trainer_cannot_create_claim(self):
        trainer = UserFactory(trainer=True)
        enrollment, learner = _make_enrollment()
        certificate = _make_certificate(enrollment)
        self.auth(trainer)
        resp = self.post_json(CLAIMS_URL, {
            "certificate": str(certificate.id),
            "message": "Test",
        })
        self.assertEqual(resp.status_code, 403)

    def test_trainer_cannot_update_claim(self):
        from apps.cohorts.tests.factories import CohortFactory, TrainerAssignmentFactory

        trainer = UserFactory(trainer=True)
        cohort = CohortFactory()
        TrainerAssignmentFactory(user=trainer, cohort=cohort)
        enrollment, learner = _make_enrollment(cohort=cohort)
        certificate = _make_certificate(enrollment)
        claim = create_claim(learner, certificate.id, "Réclamation")

        self.auth(trainer)
        resp = self.patch_json(f"{CLAIMS_URL}{claim.id}/", {
            "status": "in_progress",
        })
        self.assertEqual(resp.status_code, 403)
