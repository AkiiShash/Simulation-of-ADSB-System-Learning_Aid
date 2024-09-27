from functools import wraps
import json
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from users.models import BaseUser


def authenticate_websocket_receive(func):
    @wraps(func)
    async def wrapper(self, text_data, **kwargs):
        user = None
        try:
            data = json.loads(text_data)
            token = data.get("token")
            if token:
                user = await get_user_from_token(token, self)
                if isinstance(user, BaseUser):
                    self.scope["user"] = user

                else:
                    # Handle invalid token or anonymous user
                    # For example, you can close the connection
                    await self.close(1000)
                    return
        except Exception as e:
            # Handle any other errors that may occur during authentication
            print("Error during WebSocket authentication:", e)
            await self.close(1000)
            return

        # Call the original receive method with the authenticated user
        # print(f"\n[CONNECTED] {user}\n")
        await func(self, text_data, **kwargs)

    return wrapper


@database_sync_to_async
def get_user_from_token(token_string: str, self):
    try:
        token = AccessToken(token_string)
        token_payload = token.payload
        user_id = token_payload["user_id"]
        user = BaseUser.objects.get(pk=user_id)
        user.channel_id = self.channel_name
        user.save()

        return user
    except (InvalidToken, TokenError, BaseUser.DoesNotExist) as e:
        print(e)
        return AnonymousUser()
