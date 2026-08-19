"""Tests du service create_attachments et du lien polymorphe (GenericForeignKey)."""

import io
import os
import shutil
import tempfile

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.files.base import File as DjangoFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from apps.attachments.models import Attachment
from apps.attachments.services import create_attachments
from apps.core.tests.base import AuthTestCase
from apps.core.tests.factories import UserFactory
from apps.programs.models import Program

TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix="test_media_services_")


def make_file(name, content=b"contenu"):
    return SimpleUploadedFile(name, content)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class CreateAttachmentsTests(AuthTestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def test_links_files_to_parent_and_resolves_content_object(self):
        user = UserFactory()
        program = Program.objects.create(title="Programme test")
        attachments = create_attachments(
            user,
            [make_file("a.pdf"), make_file("b.zip")],
            parent=program,
        )
        assert len(attachments) == 2
        assert Attachment.objects.count() == 2
        for att in attachments:
            assert att.content_object == program
            assert att.uploaded_by == user
            assert att.original_filename in ("a.pdf", "b.zip")
        linked = Attachment.objects.filter(
            content_type=ContentType.objects.get_for_model(Program),
            object_id=program.id,
        )
        assert linked.count() == 2

    def test_attachment_without_parent_has_null_fields(self):
        user = UserFactory()
        attachments = create_attachments(user, [make_file("libre.pdf")])
        att = attachments[0]
        assert att.content_type is None
        assert att.object_id is None
        assert att.content_object is None

    def test_invalid_extension_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            create_attachments(UserFactory(), [make_file("script.exe")])
        assert Attachment.objects.count() == 0

    def test_partial_failure_rolls_back_the_batch_and_no_bytes_written(self):
        before = os.listdir(TEST_MEDIA_ROOT)
        with self.assertRaises(ValidationError):
            create_attachments(
                UserFactory(),
                [make_file("ok.pdf"), make_file("gros.exe")],
                parent=Program.objects.create(title="P"),
            )
        assert Attachment.objects.count() == 0
        # Aucun octet écrit sur le stockage (2 passes : validation avant écriture).
        assert os.listdir(TEST_MEDIA_ROOT) == before

    def test_original_filename_is_truncated_to_255(self):
        # SimpleUploadedFile tronque déjà le nom à 255 à la construction ; on
        # utilise un DjangoFile pour exercer la troncature du modèle (protection
        # Postgres contre les noms > 255).
        file = DjangoFile(io.BytesIO(b"contenu"), name="a" * 300 + ".pdf")
        raw = Attachment(file=file, uploaded_by=UserFactory())
        raw.full_clean()
        raw.save()
        assert raw.original_filename == "a" * 255
