import uuid
import math
from django.db import models
from channels.db import database_sync_to_async


class AdminAircraft(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)


class Aircraft(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    aircraft_id = models.CharField(max_length=6, null=True)

    admin = models.ForeignKey(AdminAircraft, on_delete=models.CASCADE)

    angle = models.DecimalField(decimal_places=4, max_digits=10)

    altitude = models.DecimalField(decimal_places=4, max_digits=10)
    max_altitude = models.DecimalField(decimal_places=4, max_digits=10, null=True)

    velocity = models.IntegerField()
    max_velocity = models.IntegerField(null=True)

    start_pos_lng = models.DecimalField(max_digits=20, decimal_places=16)
    start_pos_lat = models.DecimalField(max_digits=20, decimal_places=16)

    end_pos_lng = models.DecimalField(max_digits=20, decimal_places=16)
    end_pos_lat = models.DecimalField(max_digits=20, decimal_places=16)

    cur_pos_lng = models.DecimalField(max_digits=20, decimal_places=16)
    cur_pos_lat = models.DecimalField(max_digits=20, decimal_places=16)

    AICRAFT_TYPES = (
        ("A", "Admin"),
        ("U", "User"),
    )
    aircraft_type = models.CharField(max_length=1, choices=AICRAFT_TYPES, default="A")

    @database_sync_to_async
    def move_aircraft(self, simulation_time_factor):
        if (
            self.cur_pos_lat == self.end_pos_lat
            and self.cur_pos_lng == self.end_pos_lng
        ):
            return

        R = 6371
        dLat = ((self.end_pos_lat - self.cur_pos_lat) * math.pi) / 180
        dLng = ((self.end_pos_lng - self.cur_pos_lng) * math.pi) / 180
        lat1 = (self.cur_pos_lat * math.pi) / 180
        lat2 = (self.end_pos_lat * math.pi) / 180

        a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.sin(dLng / 2) * math.sin(
            dLng / 2
        ) * math.cos(lat1) * math.cos(lat2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        totalDistance = R * c

        stepLat = self.end_pos_lat - self.cur_pos_lat
        stepLng = self.end_pos_lng - self.cur_pos_lng

        distance_to_move = self.velocity * (simulation_time_factor / 3600.0)

        move_fraction = distance_to_move / totalDistance if totalDistance != 0 else 0

        stepLat = (self.end_pos_lat - self.cur_pos_lat) * move_fraction
        stepLng = (self.end_pos_lng - self.cur_pos_lng) * move_fraction

        self.cur_pos_lat = self.cur_pos_lat + stepLat
        self.cur_pos_lng = self.cur_pos_lng + stepLng

        if stepLat >= 0 and self.cur_pos_lat > self.end_pos_lat:
            self.cur_pos_lat = self.end_pos_lat
        elif stepLat < 0 and self.cur_pos_lat < self.end_pos_lat:
            self.cur_pos_lat = self.end_pos_lat

        if stepLng >= 0 and self.cur_pos_lng > self.end_pos_lng:
            self.cur_pos_lng = self.end_pos_lng
        elif stepLng < 0 and self.cur_pos_lng < self.end_pos_lng:
            self.cur_pos_lng = self.end_pos_lng

        self.save()

        return self
