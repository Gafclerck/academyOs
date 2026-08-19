"""Tests du module Attachment : upload multipart, validations, permissions.

MEDIA_ROOT est redirigé vers un répertoire temporaire pour ne pas polluer
`media/` du projet pendant les tests.
"""

import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from django.test import override_settings

from apps.attachments.models import Attachment
from apps.core.tests.base import API_PREFIX, AuthAPITestCase
from apps.core.tests.factories import UserFactory

ATTACHMENTS_URL = f"{API_PREFIX}/attachments/"

TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix="test_media_")


def make_file(name, content=b"contenu de test"):
    return SimpleUploadedFile(name, content)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class AttachmentTests(AuthAPITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def test_upload_requires_authentication(self):
        response = self.auth(None).post(
            ATTACHMENTS_URL, {"file": make_file("rapport.pdf")}, format="multipart"
        )
        assert response.status_code == 401

    def test_upload_valid_file_succeeds_and_stores_original_filename(self):
        user = UserFactory()
        response = self.auth(user).post(
            ATTACHMENTS_URL,
            {"file": make_file("rapport_final.pdf")},
            format="multipart",
        )
        assert response.status_code == 201, response.data
        attachment = Attachment.objects.get()
        assert attachment.uploaded_by == user
        assert attachment.original_filename == "rapport_final.pdf"
        assert attachment.file.name != "attachments/rapport_final.pdf"

    def test_upload_rejects_oversized_file(self):
        big_content = b"x" * (11 * 1024 * 1024)
        response = self.auth(UserFactory()).post(
            ATTACHMENTS_URL,
            {"file": make_file("gros.pdf", content=big_content)},
            format="multipart",
        )
        assert response.status_code == 400
        assert "file" in response.data

    def test_upload_rejects_disallowed_extension(self):
        response = self.auth(UserFactory()).post(
            ATTACHMENTS_URL, {"file": make_file("script.exe")}, format="multipart"
        )
        assert response.status_code == 400
        assert "file" in response.data

    def test_user_can_only_see_own_attachments(self):
        owner = UserFactory()
        other = UserFactory()
        self.auth(owner).post(
            ATTACHMENTS_URL, {"file": make_file("prive.pdf")}, format="multipart"
        )
        attachment = Attachment.objects.get()

        response = self.auth(other).get(f"{ATTACHMENTS_URL}{attachment.id}/")
        assert response.status_code == 404

        response = self.auth(owner).get(f"{ATTACHMENTS_URL}{attachment.id}/")
        assert response.status_code == 200
        assert response.data["original_filename"] == "prive.pdf"

    def test_admin_can_see_any_attachment(self):
        owner = UserFactory()
        admin = UserFactory(admin=True)
        self.auth(owner).post(
            ATTACHMENTS_URL, {"file": make_file("doc.pdf")}, format="multipart"
        )
        attachment = Attachment.objects.get()

        response = self.auth(admin).get(f"{ATTACHMENTS_URL}{attachment.id}/")
        assert response.status_code == 200

    def test_s3_backend_generates_signed_url(self):
        s3_storages = {
            "default": {
                "BACKEND": "storages.backends.s3.S3Storage",
                "OPTIONS": {
                    "access_key": "dummy-key",
                    "secret_key": "dummy-secret",
                    "bucket_name": "academy-os-test",
                    "endpoint_url": "https://example.r2.cloudflarestorage.com",
                    "region_name": "auto",
                    "querystring_auth": True,
                },
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
            },
        }
        with override_settings(STORAGES=s3_storages):
            url = default_storage.url("attachments/test.pdf")
        assert "X-Amz-Signature" in url
