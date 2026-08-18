from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    InviteSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UpdateMeSerializer,
    UserSerializer,
)
from .permissions import IsAdmin, IsAdminOrOrganizer
from .services import (
    create_user_by_admin,
    generate_reset_token,
    invite_user,
    reset_password,
    send_reset_password_email,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ - création d'un compte par l'admin, rôle au choix.

    Le mot de passe n'est pas fourni : un code est envoyé par email pour que
    l'utilisateur définisse son premier mot de passe (reset-password).
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAdmin]

    @extend_schema(responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = create_user_by_admin(**serializer.validated_data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


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

    @extend_schema(request=ChangePasswordSerializer, responses={200: None})
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
    """POST /api/v1/auth/invite/ - invite un formateur ou un apprenant par email."""

    permission_classes = [IsAdminOrOrganizer]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "invite"

    @extend_schema(request=InviteSerializer, responses={200: None, 201: None})
    def post(self, request):
        serializer = InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, created = invite_user(
            serializer.validated_data["email"],
            serializer.validated_data["role"],
        )
        return Response(
            {"detail": "Invitation envoyée.", "email": user.email},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password/ - envoie un code de réinitialisation.

    Réponse identique que l'email existe ou non (anti-énumération).
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "forgot"

    @extend_schema(request=ForgotPasswordSerializer, responses={200: None})
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email).first()
        if user:
            code = generate_reset_token(user)
            send_reset_password_email(user.email, code)
        return Response(
            {"detail": "Si un compte existe avec cet email, un code a été envoyé."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password/ - définit un nouveau mot de passe via le code."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reset"

    @extend_schema(request=ResetPasswordSerializer, responses={200: None})
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_password(
            serializer.validated_data["email"],
            serializer.validated_data["code"],
            serializer.validated_data["new_password"],
        )
        return Response({"detail": "Mot de passe réinitialisé."}, status=status.HTTP_200_OK)
