import uuid
import math
from django.db import models
from django.contrib.auth.models import AbstractUser
from channels.db import database_sync_to_async
from django.utils import timezone

from aircraft.models import AdminAircraft, Aircraft


# think aircraft as cilinder
AIRCRAFT_HEIGHT = 5  # 5m
AIRCRAFT_RADIUS = 17  # 17m


class BaseUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    first_name = None
    last_name = None

    USER_ROLES = (
        ("A", "Admin"),
        ("U", "User"),
    )
    role = models.CharField(max_length=1, choices=USER_ROLES)
    channel_id = models.CharField(max_length=250, default="", blank=True, null=True)

    def __str__(self) -> str:
        return self.email


class AdminUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        BaseUser, on_delete=models.CASCADE, related_name="admin_profile"
    )


class ClashPosition(models.Model):
    clash_time = models.DateTimeField()
    clash_pos_lat = models.DecimalField(max_digits=20, decimal_places=16)
    clash_pos_lng = models.DecimalField(max_digits=20, decimal_places=16)
    clash_altitude = models.DecimalField(max_digits=10, decimal_places=2)

    @staticmethod
    def calculate_distance(aircraft1, aircraft2):
        # Calculate the distance between two aircraft using Haversine formula
        lat1, lon1 = aircraft1.cur_pos_lat, aircraft1.cur_pos_lng
        lat2, lon2 = aircraft2.cur_pos_lat, aircraft2.cur_pos_lng
        R = 6371e3  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2) * math.sin(delta_phi / 2) + math.cos(
            phi1
        ) * math.cos(phi2) * math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance

    @classmethod
    def calculate_clash_points(cls, session):
        aircraft_instances = session.aircrafts.all()

        # Iterate over all aircraft instances to find clash points
        for i, aircraft1 in enumerate(aircraft_instances):
            for aircraft2 in aircraft_instances[i + 1 :]:
                # Perform clash point calculation
                cls.calculate_clash_point(session, aircraft1, aircraft2)

    @classmethod
    def calculate_clash_point(cls, session, aircraft1, aircraft2):
        # Calculate the distance between the two aircraft
        distance = cls.calculate_distance(aircraft1, aircraft2)

        # Determine if the distance is below a threshold for a clash
        CLASH_DISTANCE_THRESHOLD = 100  # Placeholder value, adjust as needed
        if distance < CLASH_DISTANCE_THRESHOLD:
            # If clash detected, record clash position
            cls.objects.create(
                clash_pos_lat=aircraft1.cur_pos_lat,
                clash_pos_lng=aircraft1.cur_pos_lng,
                clash_altitude=aircraft1.altitude,
                clash_time=timezone.now(),
                session=session,
            )


class SimulationSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    admin = models.ForeignKey(
        AdminUser, on_delete=models.CASCADE, related_name="simulation_sessions"
    )

    aircrafts = models.ManyToManyField(
        AdminAircraft, related_name="admin_aircraft_list", blank=True
    )
    controllable_aircraft = models.ForeignKey(
        AdminAircraft,
        related_name="controllable_aircraft",
        on_delete=models.CASCADE,
        null=True,
    )
    users = models.ManyToManyField(BaseUser, blank=True)

    SESSION_STATUS = (
        ("created", "Created"),
        ("started", "Started"),
        ("paused", "Paused"),
        ("closed", "Closed"),
    )
    status = models.CharField(max_length=10, choices=SESSION_STATUS, default="created")
    SESSION_POSTING_TYPE = (
        ("all", "All Users"),
        ("users", "Selected Users"),
    )
    post_type = models.CharField(
        max_length=10, choices=SESSION_POSTING_TYPE, default="all"
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    simmulation_time = models.IntegerField(default=360)

    clash_positions = models.ManyToManyField(ClashPosition, blank=True)

    @classmethod
    def get_session(cls, pk):
        return cls.objects.filter(pk=pk).first()

    @database_sync_to_async
    def create_simulation(self, data: dict, admin):
        self.post_type = data["post_type"]
        self.admin = admin
        self.simmulation_time = data["simmulation_time"]
        self.save()

        if self.post_type == "users":
            users = data["users"]
            for user in users:
                new_user = self.create_user(user)
                if new_user:
                    self.users.add(new_user)

        for aircraft in data["aircrafts"]:
            new_aircraft = self.create_aircraft(aircraft)
            self.aircrafts.add(new_aircraft)

        self.save()
        return self

    def create_aircraft(self, data: dict):
        angleRadians = math.atan2(
            data["end_pos"]["lng"] - data["start_pos"]["lng"],
            data["end_pos"]["lat"] - data["start_pos"]["lat"],
        )
        angleDegrees = angleRadians * (180 / math.pi)

        try:
            admin_aicraft = AdminAircraft()
            admin_aicraft.save()
            aircraft = Aircraft(
                aircraft_id=data["aircraft_id"],
                admin=admin_aicraft,
                angle=angleDegrees,
                altitude=data["max_altitude"],
                max_altitude=data["max_altitude"],
                velocity=data["max_velocity"],
                max_velocity=data["max_velocity"],
                start_pos_lng=data["start_pos"]["lng"],
                start_pos_lat=data["start_pos"]["lat"],
                end_pos_lng=data["end_pos"]["lng"],
                end_pos_lat=data["end_pos"]["lat"],
                cur_pos_lng=data["start_pos"]["lng"],
                cur_pos_lat=data["start_pos"]["lat"],
            )
            aircraft.save()

            return admin_aicraft

        except Exception as e:
            print(e)
            return None

    def create_user(self, user_id):
        try:
            user = BaseUser.objects.get(pk=user_id)
            return user
        except Exception as e:
            print(e)
            return None

    @database_sync_to_async
    def start_session(self):
        self.status = "started"
        all_admin_aircrafts = self.aircrafts.all()
        all_aircrafts = Aircraft.objects.filter(admin__in=all_admin_aircrafts)
        for aircrft in all_aircrafts:
            aircrft.move_aircraft(self.simmulation_time)

    @database_sync_to_async
    def pause_session(self):
        pass


class SessionInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        SimulationSession, on_delete=models.CASCADE, related_name="session_instances"
    )
    aircrafts = models.ManyToManyField(Aircraft, related_name="aircraft_list")
    controllable_aircraft = models.ForeignKey(
        Aircraft,
        related_name="controllable_aircraft",
        on_delete=models.CASCADE,
        null=True,
    )
    user = models.ForeignKey(BaseUser, null=True, on_delete=models.CASCADE)

    @database_sync_to_async
    def create_instance(self, session: SimulationSession, user: BaseUser):
        self.session = session
        self.user = user

        self.save()

        session_aircrafts = session.aircrafts.all()

        admin_aircrafts = Aircraft.objects.filter(
            admin__in=session_aircrafts, aircraft_type="A"
        )

        for aircrft in admin_aircrafts:
            new_aircrft = aircrft
            new_aircrft.pk = None
            new_aircrft.aircraft_type = "U"
            new_aircrft.save()

            if aircrft.id == session.controllable_aircraft:
                self.controllable_aircraft = new_aircrft
                self.save()

            self.aircrafts.add(new_aircrft)

        return self

    @database_sync_to_async
    def start_session(self):
        pass

    @database_sync_to_async
    def pause_session(self):
        pass
