from django.db import models
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView as SimpleJWTTokenRefreshView,
)

from .models import User
from .serializers import (
    ActivateAccountSerializer,
    AdminUserSerializer,
    ChangePasswordSerializer,
    CreateUserSerializer,
    ForgotPasswordSerializer,
    InviteSerializer,
    ResetPasswordSerializer,
    UpdateMeSerializer,
    UserSerializer,
)
from .permissions import IsAdmin, IsAdminOrOrganizer
from .services import (
    activate_user,
    generate_reset_token,
    invite_user,
    invite_users,
    reset_password,
    send_invitation_email,
    send_reset_password_email,
)



@extend_schema_view(
    post=extend_schema(
        summary="Obtain JWT token pair (access and refresh)",
        description="Authentification par email et mot de passe. Renvoie une paire de tokens JWT (`access` et `refresh`).",
        tags=["Auth"],
    )
)
class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ - Authentification JWT avec limitation de débit (5/min)."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


@extend_schema_view(
    post=extend_schema(
        summary="Refresh JWT access token",
        description="Renvoie un nouveau token d'accès JWT (`access`) à partir d'un refresh token valide (`refresh`).",
        tags=["Auth"],
    )
)
class TokenRefreshView(SimpleJWTTokenRefreshView):
    """POST /api/v1/auth/token/refresh/ - Rafraîchissement du token d'accès JWT."""

    pass


@extend_schema_view(
    get=extend_schema(summary="Retrieve the authenticated user's profile", tags=["Auth"]),
    patch=extend_schema(summary="Update the authenticated user's profile", tags=["Auth"]),
    put=extend_schema(summary="Update the authenticated user's profile", tags=["Auth"]),
)
class MeView(generics.RetrieveUpdateAPIView):

    """GET /api/v1/auth/me/ et PATCH /api/v1/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UpdateMeSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={200: None}, tags=["Auth"])
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe mis à jour."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ - blackliste le refresh token."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
        responses={205: None},
        tags=["Auth"]
    )
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Le champ 'refresh' est requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Token invalide ou déjà révoqué."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class InviteView(APIView):
    """POST /api/v1/auth/invite/ - invite des formateurs ou apprenants par email.

    `{"email": ...}` : un seul (réponse {detail, email}).
    `{"emails": [...]}` : en lot (réponse {results: [{email, status, detail}]}).
    """

    permission_classes = [IsAdminOrOrganizer]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "invite"

    @extend_schema(request=InviteSerializer, responses={200: None, 201: None}, tags=["Auth"])
    def post(self, request):
        serializer = InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]

        if serializer.validated_data.get("emails"):
            results = invite_users(serializer.validated_data["emails"], role)
            return Response({"results": results}, status=status.HTTP_201_CREATED)

        user, created = invite_user(serializer.validated_data["email"], role)
        return Response(
            {"detail": "Invitation envoyée.", "email": user.email},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password/ - envoie un code de réinitialisation.

    Réponse identique que l'email existe ou non (anti-énumération).
    - Compte 'active' : envoie le code de réinitialisation (30 min).
    - Compte 'pending' : renvoie le code d'invitation (7 jours).
    - Compte 'suspended' / 'archived' : n'envoie rien.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "forgot"

    @extend_schema(request=ForgotPasswordSerializer, responses={200: None}, tags=["Auth"])
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if user:
            if user.status == User.Status.ACTIVE:
                code = generate_reset_token(user, expires_in=timezone.timedelta(minutes=30))
                send_reset_password_email(user.email, code)
            elif user.status == User.Status.PENDING:
                code = generate_reset_token(user, expires_in=timezone.timedelta(days=7))
                send_invitation_email(user.email, code)
        return Response(
            {"detail": "Si un compte existe avec cet email, un code a été envoyé."},
            status=status.HTTP_200_OK,
        )

class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password/ - définit un nouveau mot de passe via le code (compte ACTIVE)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reset"

    @extend_schema(request=ResetPasswordSerializer, responses={200: None}, tags=["Auth"])
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_password(
            serializer.validated_data["email"],
            serializer.validated_data["code"],
            serializer.validated_data["new_password"],
        )
        return Response({"detail": "Mot de passe réinitialisé."}, status=status.HTTP_200_OK)


class ActivateAccountView(APIView):
    """POST /api/v1/auth/activate/ - active un compte invité (PENDING) avec mot de passe et profil."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "activate"


    @extend_schema(request=ActivateAccountSerializer, responses={200: None}, tags=["Auth"])
    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activate_user(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["new_password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            phone_number=serializer.validated_data.get("phone_number"),
        )
        return Response({"detail": "Compte activé avec succès."}, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(summary="List all users", tags=["Users"]),
    create=extend_schema(
        summary="Create a user directly (Admin only)",
        request=CreateUserSerializer,
        responses={201: AdminUserSerializer},
        tags=["Users"],
    ),
    retrieve=extend_schema(summary="Retrieve user details", tags=["Users"]),
    update=extend_schema(summary="Update a user", tags=["Users"]),
    partial_update=extend_schema(summary="Partially update a user", tags=["Users"]),
    destroy=extend_schema(summary="Delete a user", tags=["Users"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """Administration des utilisateurs (Admin : CRUD complet ; Organizer : consultation)."""

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return AdminUserSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAdminOrOrganizer()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ("true", "1"))
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
            )
        return queryset

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError({"detail": "Un administrateur ne peut pas supprimer son propre compte."})
        super().perform_destroy(instance)

