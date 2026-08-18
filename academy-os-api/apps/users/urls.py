from django.urls import include, path
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    ForgotPasswordView,
    InviteView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ResetPasswordView,
    UserViewSet,
)

user_router = SimpleRouter()
user_router.register(r"", UserViewSet, basename="user")

auth_patterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("invite/", InviteView.as_view(), name="auth-invite"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
]

urlpatterns = [
    path("auth/", include(auth_patterns)),
    path("users/", include(user_router.urls)),
]