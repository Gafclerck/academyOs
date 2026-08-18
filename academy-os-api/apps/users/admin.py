from django.contrib import admin

# apps/users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import PasswordResetToken, User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "first_name", "last_name", "role", "status", "phone_number", "is_active", "is_staff"]
    list_filter = ["role", "status", "is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "phone_number")}),
        ("Rôle & statut", {
            "fields": ("role", "status", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        ("Dates", {"fields": ("last_login", "password_reset_at", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role", "status"),
        }),
    )
    readonly_fields = ["created_at", "updated_at", "last_login", "password_reset_at"]


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at", "expires_at", "used"]
    list_filter = ["used"]
    search_fields = ["user__email"]
    readonly_fields = ["user", "token", "expires_at", "used", "created_at"]
