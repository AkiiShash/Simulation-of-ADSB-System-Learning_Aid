import json
import time
from typing import List
from channels.generic.websocket import AsyncWebsocketConsumer
from backend.decoraters import authenticate_websocket_receive
from django.db.models import Q
from channels.db import database_sync_to_async

from .models import SimulationSession, BaseUser, AdminUser, SessionInstance, Aircraft
from .serializers import SimulationSessionSerializer, SessionInstanceSerializer


class SimulationSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.session_started = False

    @authenticate_websocket_receive
    async def receive(self, text_data):
        data = json.loads(text_data)
        user = self.scope["user"]
        data_type = data.get("type")

        if data_type == "admin.login":
            await self.join_user_to_session_when_connected(user, user_type="admin")
            await self.channel_layer.group_add(str(user.id), self.channel_name)

        if data_type == "user.login":
            await self.join_user_to_session_when_connected(user)
            await self.channel_layer.group_add(str(user.id), self.channel_name)

        if data_type == "session.new":
            admin_user = await self.get_admin_user(user)
            if admin_user:
                data = data["data"]

                session_list = []

                session = await SimulationSession().create_simulation(data, admin_user)
                await self.channel_layer.group_add(str(session.id), user.channel_id)

                if session.post_type == "all":
                    all_users = await self.get_all_users()

                    for usr in all_users:
                        session_instance = await SessionInstance().create_instance(
                            session, usr
                        )

                        session_list.append(
                            {
                                "session": session_instance,
                                "user": str(usr.id),
                                "channel": usr.channel_id,
                            }
                        )

                        if usr.channel_id != "":
                            await self.channel_layer.group_add(
                                str(session.id), usr.channel_id
                            )

                elif session.post_type == "users":
                    session_users = await self.get_all_sessson_users(session)
                    users_list = session_users

                    for usr in session_users:
                        # create session instance for user
                        session_instance = await SessionInstance().create_instance(
                            session, usr
                        )
                        session_list.append(
                            {
                                "session": session_instance,
                                "user": str(usr.id),
                                "channel": usr.channel_id,
                            }
                        )

                        if usr.channel_id != "":
                            await self.channel_layer.group_add(
                                str(session.id), usr.channel_id
                            )

                await self.send(
                    {
                        "type": "session.new",
                        "id": str(session.id),
                        "created_at": str(session.created_at),
                    },
                )

                for session_instance in session_list:
                    if session_instance["channel"] != "":
                        session_data = await self.serialize_session_instance_data(
                            session_instance["session"]
                        )
                        send_data = {
                            "type": "send.data",
                            "data": {"type": "session.new", **session_data},
                        }
                        await self.channel_layer.group_send(
                            session_instance["user"],
                            send_data,
                        )

        if data_type == "session.start":
            data = data["data"]
            session_id = data["id"]
            await self.start_session(session_id)

        if data_type == "session.pause":
            data = data["data"]
            session_id = data["id"]
            await self.pause_session(session_id)

        if data_type == "session.resume":
            data = data["data"]
            session_id = data["id"]
            await self.resume_session(session_id)

        if data_type == "aircraft.moved":
            data = data["data"]
            print(data)
            await self.aircraft_moved(data)

    async def disconnect(self, code):
        await self.remover_user_from_active_session()
        await self.disconnect_user()
        return await super().disconnect(code)

    async def send_data(self, event):
        await self.send(text_data=event["data"])

    @database_sync_to_async
    def disconnect_user(self):
        try:
            user = BaseUser.objects.filter(channel_id=self.channel_name).first()
            if user:
                user.channel_id = ""
                user.save()
                print(f"\n[DISCONNECTED] {user}\n")
        except Exception as e:
            print(e)

    @database_sync_to_async
    def remover_user_from_active_session(self):
        user = BaseUser.objects.filter(channel_id=self.channel_name).first()
        if user:
            sessions_list = SimulationSession.objects.filter(users=user)
            if sessions_list:
                for session in sessions_list:
                    self.channel_layer.group_discard(str(session.id), self.channel_name)

    @database_sync_to_async
    def join_user_to_session_when_connected(self, user, user_type="user"):

        if user_type == "user":
            sessions_list = SimulationSession.objects.filter(
                users=user, status__in=["created", "started"]
            )
            if sessions_list:
                for session in sessions_list:
                    self.channel_layer.group_add(str(session.id), self.channel_name)

        elif user_type == "admin":
            admin_user = AdminUser.objects.filter(user=user).first()
            if admin_user:
                sessions_list = SimulationSession.objects.filter(
                    admin=admin_user, status__in=["created", "started"]
                )
                if sessions_list:
                    for session in sessions_list:
                        self.channel_layer.group_add(str(session.id), self.channel_name)

    @database_sync_to_async
    def get_all_online_users(self):
        return BaseUser.objects.filter(
            Q(role="U") & Q(channel_id__isnull=False) & ~Q(channel_id="")
        )

    @database_sync_to_async
    def get_admin_user(self, user):
        return AdminUser.objects.filter(user=user.id).first()

    @database_sync_to_async
    def get_all_sessson_users(self, session):
        return list(session.users.all())

    @database_sync_to_async
    def serialize_session_data(self, session):
        return SimulationSessionSerializer(session).data

    @database_sync_to_async
    def serialize_session_instance_data(self, session):
        return SessionInstanceSerializer(session).data

    @database_sync_to_async
    def get_all_users(self):
        return list(BaseUser.objects.filter(role="U"))

    async def send(self, text_data=None, bytes_data=None, close=False):
        return await super().send(json.dumps(text_data), bytes_data, close)

    @database_sync_to_async
    def start_session(self, session_id):
        session: SimulationSession = SimulationSession.get_session(session_id)

        if session:
            print(session)
            session.status = "started"
            session.save()

            if session.status == "started":
                while True:
                    current_session = SimulationSession.objects.filter(
                        pk=session.id
                    ).first()
                    if current_session and current_session.status == "started":
                        # run session
                        admin_aircrafts = Aircraft.objects.filter(
                            admin__in=session.aircrafts.all(), aircraft_type="A"
                        )
                        session_instance_list = SessionInstance.objects.filter(
                            session=session
                        )

                        for session_instance in session_instance_list:
                            aircrafts_in_session_instance: List[Aircraft] = (
                                session_instance.aircrafts.all()
                            )
                            session_owned_user = session_instance.user

                            for aircraft_in_instance in aircrafts_in_session_instance:
                                new_aircraft_obj: Aircraft = (
                                    aircraft_in_instance.move_aircraft(
                                        session.simmulation_time
                                    )
                                )

                                if (
                                    session_owned_user.channel_id
                                    and session_owned_user.channel_id != ""
                                ):
                                    send_data = {
                                        "type": "send.data",
                                        "data": {
                                            "type": "aircraft.moved",
                                            "data": {
                                                "aircraft": str(new_aircraft_obj.id),
                                                "position": {
                                                    "lat": float(
                                                        new_aircraft_obj.cur_pos_lat
                                                    ),
                                                    "lng": float(
                                                        new_aircraft_obj.cur_pos_lng
                                                    ),
                                                },
                                            },
                                        },
                                    }
                                    self.channel_layer.group_send(
                                        session_owned_user.channel_id,
                                        send_data,
                                    )

                        for admin_aircraft in admin_aircrafts:
                            moved_aircraft_obj: Aircraft = admin_aircraft.move_aircraft(
                                session.simmulation_time
                            )
                            if (
                                session.admin.user.channel_id
                                and session.admin.user.channel_id != ""
                            ):
                                send_data = {
                                    "type": "send.data",
                                    "data": {
                                        "type": "aircraft.moved",
                                        "data": {
                                            "aircraft": str(moved_aircraft_obj.id),
                                            "position": {
                                                "lat": float(
                                                    moved_aircraft_obj.cur_pos_lat
                                                ),
                                                "lng": float(
                                                    moved_aircraft_obj.cur_pos_lng
                                                ),
                                            },
                                        },
                                    },
                                }
                                self.channel_layer.group_send(
                                    session.admin.user.channel_id,
                                    send_data,
                                )

                    elif current_session and current_session.status == "closed":
                        break

                    time.sleep(0.1)

    @database_sync_to_async
    def pause_session(self, session_id):
        session: SimulationSession = SimulationSession.get_session(session_id)

        if session:
            session.status = "paused"
            session.save()

    @database_sync_to_async
    def resume_session(self, session_id):
        session: SimulationSession = SimulationSession.get_session(session_id)

        if session:
            session.status = "started"
            session.save()

    @database_sync_to_async
    def aircraft_moved(self, data):
        session_id = data["session_id"]
        aircraft_id = data["aircraft_id"]
        new_position = data["position"]

        session = SimulationSession.objects.filter(id=session_id).first()

        if session:
            session_instances = SessionInstance.objects.filter(session=session)

            admin_aircraft = Aircraft.objects.filter(
                admin__in=session.aircrafts.all(),
                aircraft_type="A",
                aircraft_id=aircraft_id,
            ).first()

            admin_aircraft.cur_pos_lat = new_position["lat"]
            admin_aircraft.cur_pos_lng = new_position["lng"]
            admin_aircraft.save()

            for instance in session_instances:
                instance_user = instance.user
                instance_aircraft: Aircraft = instance.aircrafts.filter(
                    aircraft_id=aircraft_id
                ).first()
                if instance_aircraft:
                    instance_aircraft.cur_pos_lat = new_position["lat"]
                    instance_aircraft.cur_pos_lng = new_position["lng"]
                    instance_aircraft.save()

                    if instance_user.channel_id and instance_user.channel_id != "":
                        send_data = {
                            "type": "send.data",
                            "data": {
                                "type": "aircraft.moved",
                                "data": {
                                    "aircraft": str(instance_aircraft.id),
                                    "position": {
                                        "lat": float(instance_aircraft.cur_pos_lat),
                                        "lng": float(instance_aircraft.cur_pos_lng),
                                    },
                                },
                            },
                        }
                        self.channel_layer.group_send(
                            instance_user.channel_id,
                            send_data,
                        )
