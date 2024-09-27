from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.serializers import ValidationError

from .models import (
    BaseUser,
    AdminUser,
    SimulationSession,
    AdminAircraft,
    Aircraft,
    SessionInstance,
)


def check_user_exists(email):
    user = BaseUser.objects.filter(email=email)
    if not user.exists():
        raise ValidationError("Invalid user credentials")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True, validators=[check_user_exists], min_length=5
    )
    password = serializers.CharField(required=True, min_length=8)


class UserRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()

    class Meta:
        model = BaseUser
        fields = ["email", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Hash the password before saving
        validated_data["password"] = make_password(validated_data.get("password"))
        validated_data["username"] = validated_data.get("email")

        return super().create(validated_data)

    def validate_email(self, value):
        """
        Check if the provided email already exists in the database.
        """
        if BaseUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return value


class BaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = [
            "id",
            "email",
            "role",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    user = BaseUserSerializer()

    class Meta:
        model = AdminUser
        fields = [
            "id",
            "user",
        ]


class AircraftSerializer(serializers.ModelSerializer):
    start_pos = serializers.SerializerMethodField("get_start_pos")
    end_pos = serializers.SerializerMethodField("get_end_pos")
    current_pos = serializers.SerializerMethodField("get_cur_pos")

    max_altitude = serializers.SerializerMethodField()
    max_velocity = serializers.SerializerMethodField()
    angle = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()
    velocity = serializers.SerializerMethodField()

    class Meta:
        model = Aircraft
        fields = (
            "id",
            "aircraft_id",
            "start_pos",
            "end_pos",
            "current_pos",
            "max_altitude",
            "max_velocity",
            "angle",
            "altitude",
            "velocity",
        )

    def get_start_pos(self, obj):
        return {"lat": float(obj.start_pos_lat), "lng": float(obj.start_pos_lng)}

    def get_end_pos(self, obj):
        return {"lat": float(obj.end_pos_lat), "lng": float(obj.end_pos_lng)}

    def get_cur_pos(self, obj):
        return {"lat": float(obj.cur_pos_lat), "lng": float(obj.cur_pos_lng)}

    def get_max_altitude(self, obj):
        return float(obj.max_altitude)

    def get_max_velocity(self, obj):
        return float(obj.max_velocity)

    def get_angle(self, obj):
        return float(obj.angle)

    def get_altitude(self, obj):
        return float(obj.altitude)

    def get_velocity(self, obj):
        return float(obj.velocity)


class AdminAircraftSerializer(serializers.ModelSerializer):
    aircraft = serializers.SerializerMethodField()

    class Meta:
        model = AdminAircraft
        fields = ["id", "aircraft"]

    def get_aircraft(self, obj):
        aircraft = Aircraft.objects.filter(admin=obj.id).first()
        return AircraftSerializer(aircraft).data


class SimulationSessionSerializer(serializers.ModelSerializer):
    users = BaseUserSerializer(many=True)
    admin = AdminUserSerializer()
    aircrafts = serializers.SerializerMethodField()
    controllable_aircraft = serializers.SerializerMethodField()

    class Meta:
        model = SimulationSession
        fields = "__all__"

    def get_aircrafts(self, obj):
        aircrafts = Aircraft.objects.filter(
            admin__in=obj.aircrafts.all(), aircraft_type="A"
        )
        return AircraftSerializer(aircrafts, many=True).data

    def get_controllable_aircraft(self, obj):
        aircrafts = Aircraft.objects.filter(
            admin__in=obj.aircrafts.all(), aircraft_type="A"
        ).first()
        return AircraftSerializer(aircrafts).data


class SessionInstanceSerializer(serializers.ModelSerializer):
    session = serializers.SerializerMethodField()
    aircrafts = AircraftSerializer(many=True)
    created_at = serializers.DateTimeField(source="session.created_at")
    simmulation_time = serializers.IntegerField(source="session.simmulation_time")
    status = serializers.CharField(source="session.status")

    class Meta:
        model = SessionInstance
        fields = [
            "id",
            "session",
            "aircrafts",
            "created_at",
            "simmulation_time",
            "status",
        ]

    def get_session(self, obj):
        return str(obj.session.id)
