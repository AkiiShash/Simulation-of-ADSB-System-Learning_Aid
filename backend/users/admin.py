from django.contrib import admin
from users.models import BaseUser, AdminUser, SimulationSession, SessionInstance


@admin.register(BaseUser)
class BaseUserAdmin(admin.ModelAdmin):
    list_display = ["id", "email", "role"]
    list_editable = ["role"]


@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ["id", "user"]


@admin.register(SimulationSession)
class SimulationSessionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "admin",
        "status",
        "post_type",
        "created_at",
    ]


@admin.register(SessionInstance)
class SessionInstanceAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "session",
    ]
