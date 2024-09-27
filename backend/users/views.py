from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions
from django.contrib.auth.hashers import check_password

from .serializers import (
    UserRegisterSerializer,
    BaseUserSerializer,
    UserLoginSerializer,
    SessionInstanceSerializer,
)
from .models import BaseUser, AdminUser, SessionInstance


class UserRegisterView(ModelViewSet):
    serializer_class = UserRegisterSerializer
    queryset = BaseUser.objects.all()

    def create(self, request, *args, **kwargs):
        data = request.data
        serializer = UserRegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = serializer.create(serializer.validated_data)
        if user.role == "A":
            admin_user = AdminUser(user=user)
            admin_user.save()

        refresh = RefreshToken.for_user(user)

        user_data = BaseUserSerializer(user).data

        return Response(
            {
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "data": user_data,
            },
            status=status.HTTP_200_OK,
        )


class UserLoginView(ModelViewSet):
    serializer_class = UserLoginSerializer

    def get_queryset(self) -> BaseUser | None:
        email = self.request.data["email"]
        return BaseUser.objects.filter(email=email).first()

    def create(self, request):
        data = request.data

        serializer = UserLoginSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data["password"]

        user = self.get_queryset()

        if not check_password(password, user.password):
            return Response({"detail": "Invalid credentials"})

        refresh = RefreshToken.for_user(user)
        user_data = BaseUserSerializer(user).data

        return Response(
            {
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "data": user_data,
            },
            status=status.HTTP_200_OK,
        )


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        serializer = BaseUserSerializer(user)

        return Response(serializer.data, status=status.HTTP_200_OK)


class UsersView(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = BaseUser.objects.filter(role="U")
    serializer_class = BaseUserSerializer
