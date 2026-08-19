import uuid

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Manager custom : obligatoire car on remplace `username` par `email`."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def get_by_natural_key(self, username):
        return self.get(**{f"{self.model.USERNAME_FIELD}__iexact": username.strip().lower()})

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", User.Role.LEARNER)
        extra_fields.setdefault("status", User.Status.ACTIVE)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("status", User.Status.ACTIVE)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser doit avoir is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        ORGANIZER = "organizer", "Organizer"
        TRAINER = "trainer", "Trainer"
        LEARNER = "learner", "Learner"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LEARNER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r"^\+?[0-9\s\-()]{7,20}$",
                message="Format de numéro de téléphone invalide.",
            )
        ],
    )

    password_reset_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []   # email + password déjà requis par le manager ; rien d'autre n'est obligatoire à la création

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # Synchronise is_active avec status (seul ACTIVE a is_active=True)
        self.is_active = (self.status == self.Status.ACTIVE)
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            update_fields = set(update_fields)
            if "status" in update_fields:
                update_fields.add("is_active")
            kwargs["update_fields"] = list(update_fields)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class PasswordResetToken(models.Model):
    """Token de réinitialisation / invitation : usage unique et expirant.
    Le code OTP n'est jamais stocké en clair : seul son hash HMAC-SHA256 est conservé.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.CharField(max_length=128, db_index=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_expired(self):
        return self.expires_at <= timezone.now()

    def __str__(self):
        return f"token(user={self.user_id}, exp={self.expires_at:%Y-%m-%d %H:%M}, used={self.used})"