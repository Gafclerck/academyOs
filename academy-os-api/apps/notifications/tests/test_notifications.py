from django.core.exceptions import PermissionDenied
from django.test import TestCase

from apps.core.tests.base import AuthAPITestCase
from apps.core.tests.factories import UserFactory
from apps.notifications.models import Notification
from apps.notifications.services import (
    create_notification,
    get_unread_count,
    mark_all_as_read,
    mark_as_read,
    mark_as_unread,
)

NOTIFICATIONS_URL = "/api/v1/notifications/"


class NotificationServiceTests(TestCase):
    """Tests unitaires des services notifications."""

    def test_create_notification_basic(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Titre",
            message="Message",
        )
        self.assertEqual(notif.recipient, user)
        self.assertEqual(notif.notification_type, Notification.TypeEnum.CLAIM_CREATED)
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)

    def test_create_notification_with_content_object(self):
        from apps.claims.tests.factories import ClaimFactory
        from apps.notifications.tests.factories import NotificationFactory

        user = UserFactory()
        claim = ClaimFactory(learner=user)
        notif = NotificationFactory(recipient=user, content_object=claim)
        self.assertIsNotNone(notif.content_type)
        self.assertEqual(notif.object_id, claim.pk)

    def test_mark_as_read(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        result = mark_as_read(notif, user)
        self.assertTrue(result.is_read)
        self.assertIsNotNone(result.read_at)

    def test_mark_as_read_idempotent(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_as_read(notif, user)
        first_read_at = notif.read_at
        mark_as_read(notif, user)
        notif.refresh_from_db()
        self.assertEqual(notif.read_at, first_read_at)

    def test_mark_as_read_wrong_user(self):
        owner = UserFactory()
        other = UserFactory()
        notif = create_notification(
            recipient=owner,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        with self.assertRaises(PermissionDenied):
            mark_as_read(notif, other)

    def test_mark_as_unread(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_as_read(notif, user)
        result = mark_as_unread(notif, user)
        self.assertFalse(result.is_read)
        self.assertIsNone(result.read_at)

    def test_mark_as_unread_idempotent(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        result = mark_as_unread(notif, user)
        self.assertFalse(result.is_read)
        self.assertIsNone(result.read_at)

    def test_mark_as_unread_wrong_user(self):
        owner = UserFactory()
        other = UserFactory()
        notif = create_notification(
            recipient=owner,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_as_read(notif, owner)
        with self.assertRaises(PermissionDenied):
            mark_as_unread(notif, other)

    def test_mark_all_as_read(self):
        user = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="1",
            message="M1",
        )
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            title="2",
            message="M2",
        )
        count = mark_all_as_read(user)
        self.assertEqual(count, 2)
        self.assertEqual(get_unread_count(user), 0)

    def test_mark_all_as_read_only_own(self):
        user = UserFactory()
        other = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        create_notification(
            recipient=other,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_all_as_read(user)
        self.assertEqual(get_unread_count(user), 0)
        self.assertEqual(get_unread_count(other), 1)

    def test_mark_all_as_read_bumps_updated_at(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_all_as_read(user)
        notif.refresh_from_db()
        self.assertIsNotNone(notif.read_at)
        self.assertEqual(notif.read_at, notif.updated_at)

    def test_get_unread_count(self):
        user = UserFactory()
        self.assertEqual(get_unread_count(user), 0)
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        self.assertEqual(get_unread_count(user), 1)


class NotificationEndpointTests(AuthAPITestCase):
    """Tests API des endpoints notifications."""

    def test_list_notifications_authenticated(self):
        user = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="N1",
            message="M1",
        )
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            title="N2",
            message="M2",
        )
        self.auth(user)
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 2)

    def test_list_notifications_only_own(self):
        user = UserFactory()
        other = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Own",
            message="M",
        )
        create_notification(
            recipient=other,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Other",
            message="M",
        )
        self.auth(user)
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["title"], "Own")

    def test_unauthenticated_cannot_list(self):
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(resp.status_code, 401)

    def test_unread_count(self):
        user = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        self.auth(user)
        resp = self.client.get(f"{NOTIFICATIONS_URL}unread-count/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["unread_count"], 1)

    def test_mark_notification_read(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        self.auth(user)
        resp = self.client.patch(f"{NOTIFICATIONS_URL}{notif.id}/read/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["is_read"])
        self.assertIsNotNone(resp.data["read_at"])

    def test_mark_notification_read_wrong_user(self):
        owner = UserFactory()
        other = UserFactory()
        notif = create_notification(
            recipient=owner,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        self.auth(other)
        resp = self.client.patch(f"{NOTIFICATIONS_URL}{notif.id}/read/")
        self.assertEqual(resp.status_code, 404)

    def test_mark_notification_unread(self):
        user = UserFactory()
        notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_as_read(notif, user)
        self.auth(user)
        resp = self.client.patch(f"{NOTIFICATIONS_URL}{notif.id}/unread/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["is_read"])
        self.assertIsNone(resp.data["read_at"])

    def test_mark_notification_unread_wrong_user(self):
        owner = UserFactory()
        other = UserFactory()
        notif = create_notification(
            recipient=owner,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="T",
            message="M",
        )
        mark_as_read(notif, owner)
        self.auth(other)
        resp = self.client.patch(f"{NOTIFICATIONS_URL}{notif.id}/unread/")
        self.assertEqual(resp.status_code, 404)

    def test_mark_all_read(self):
        user = UserFactory()
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="1",
            message="M1",
        )
        create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="2",
            message="M2",
        )
        self.auth(user)
        resp = self.client.patch(f"{NOTIFICATIONS_URL}read-all/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["updated_count"], 2)
        self.assertEqual(get_unread_count(user), 0)

    def test_mark_all_read_via_post_returns_405(self):
        user = UserFactory()
        self.auth(user)
        resp = self.client.post(f"{NOTIFICATIONS_URL}read-all/")
        self.assertEqual(resp.status_code, 405)

    def test_list_filter_is_read(self):
        user = UserFactory()
        unread_notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_CREATED,
            title="Unread",
            message="M",
        )
        read_notif = create_notification(
            recipient=user,
            notification_type=Notification.TypeEnum.CLAIM_UPDATED,
            title="Read",
            message="M",
        )
        mark_as_read(read_notif, user)
        self.auth(user)

        resp = self.client.get(f"{NOTIFICATIONS_URL}?is_read=true")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["id"], str(read_notif.id))

        resp = self.client.get(f"{NOTIFICATIONS_URL}?is_read=false")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["id"], str(unread_notif.id))

    def test_list_filter_is_read_invalid(self):
        user = UserFactory()
        self.auth(user)
        resp = self.client.get(f"{NOTIFICATIONS_URL}?is_read=yes")
        self.assertEqual(resp.status_code, 400)
