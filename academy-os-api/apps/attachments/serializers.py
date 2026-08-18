from rest_framework import serializers

from .models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    """Détail d'un attachment : URL signée (S3) ou chemin local (dev)."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ["id", "url", "original_filename", "uploaded_by", "uploaded_at"]
        read_only_fields = fields

    def get_url(self, obj):
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class AttachmentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["file"]
