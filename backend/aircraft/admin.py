from django.contrib import admin
from .models import AdminAircraft, Aircraft


@admin.register(Aircraft)
class AircraftAdmin(admin.ModelAdmin):
    list_display = ["aircraft_id", "admin"]


@admin.register(AdminAircraft)
class AdminAircraftAdmin(admin.ModelAdmin):
    list_display = ["id"]
