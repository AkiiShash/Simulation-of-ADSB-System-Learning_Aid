from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions

from users.models import SessionInstance, AdminUser, SimulationSession
from users.serializers import SessionInstanceSerializer, SimulationSessionSerializer


class SessionView(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionInstanceSerializer

    def get_serializer_class(self):
        admin_user = AdminUser.objects.filter(user=self.request.user).first()

        if admin_user:
            return SimulationSessionSerializer

        return SessionInstanceSerializer

    def get_queryset(self):
        admin_user = AdminUser.objects.filter(user=self.request.user).first()
        if admin_user:
            return SimulationSession.objects.filter(
                admin=admin_user, status__in=["created", "started"]
            )

        return SessionInstance.objects.select_related("session").filter(
            user=self.request.user, session__status__in=["created", "started"]
        )

    def retrieve(self, request, pk):
        instance = SessionInstance.objects.select_related("session").get(pk=pk)
        return super().retrieve(request, instance.session.id)
