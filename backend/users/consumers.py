import json                                                             # for parsing / serializing messages
from channels.generic.websocket import AsyncWebsocketConsumer           # base class - handles the WS protocol for us

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # AuthMiddlewareStack doesn't handle token auth, so we read it manually from the URL
        from rest_framework.authtoken.models import Token
        from django.contrib.auth.models import AnonymousUser
        from channels.db import database_sync_to_async

        query_string = self.scope.get('query_string', b'').decode()
        token_key = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_key = part.split('=')[1]
                break

        if not token_key:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
            self.user = token.user
        except Token.DoesNotExist:
            await self.close()
            return

        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # close_code: 1000 = normal, 1006 = abnormal / network drop),
        # leave the group as we stop receiving messages
        # always do this on disconnect or you'll have ghost subscribers
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
        )
    
    async def receive (self, text_data):
        # called every time the client sends data through the WebSocket
        # text_data is a raw string - like reading from a socket with recv()

        data = json.loads(text_data)        # deserialize JSON string -> Python dict
        message = data.get('message', '')   # safely get 'message' key, default to '' if missing 

        # group_send = broadcast to ALL connections in this group
        # like writing to a multicast socket - everyone subscribed receives it
        await self.channel_layer.group_send(
            self.room_group_name,               # send to everyone in this room
            {
                'type': 'chat_message',         # 'type' tells Channels WHICH method to call on each receiver, chat_message' calls self.chat_message() below
                'message': message,             # the actual message text
                'username': self.user.username or self.user.email,  # fallback to email if no username set                   
            }
        )
    
    async def chat_message(self, event):
        # this is called on THIS connection when the channel layer delivers a group message
        # 'event' = the dict we passed to group_send above
        # think of it like a callback triggered when data arrives on your multicast socket

        # send the message back out through THIS WebSocket to the browser
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'username': event['username'],
        }))

# this consumer doesn't handle chat - it just tracks online / offline status
# when a user opens this WS connection, they're "online"; when it closes, they're "offline"
class OnlineStatusConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        from rest_framework.authtoken.models import Token
        from channels.db import database_sync_to_async

        # read token from query string (?token=xxx) since AuthMiddlewareStack
        # only handles sessions, not DRF tokens
        query_string = self.scope.get('query_string', b'').decode()
        token_key = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_key = part.split('=')[1]
                break

        if not token_key:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
            self.user = token.user
        except Token.DoesNotExist:
            await self.close()
            return

        # database_sync_to_async = adapter between async world and sync Django ORM
        # Django's ORM (database queries) is blocking / synchronous
        # but we're in an async function - calling sync code directly would freeze everything
        # this wrapper runs the sync function in a thread pool, like offloading blocking I/O to a worker thread
        await database_sync_to_async(self._set_online)(True)    # mark online before accepting

        await self.accept()

    async def disconnect(self, close_code):
        # regardless of why they disconnected (browser closed, network dropped, etc.), mark them offline
        # guard against case where connect() failed before self.user was set
        from channels.db import database_sync_to_async
        if hasattr(self, 'user'):
            await database_sync_to_async(self._set_online)(False)

    async def receive(self, text_data):
        pass    # we don't expect any messages on this connection - client just holds it open

    def _set_online(self, status):
        # regular synchronous method - no async here because database_sync_to_async handles that
        # update_fields = only write these specific columns to DB, more efficient than saving the whole object
        self.user.is_online = status
        self.user.save(update_fields=['is_online'])

# Handles WebSocket connections for live Chess games
# Both players connect here; moves are broadcast between them in real time
class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        from rest_framework.authtoken.models import Token
        from channels.db import database_sync_to_async

        # read token from query string (?token=xxx) since AuthMiddlewareStack
        # only handles sessions, not DRF tokens
        query_string = self.scope.get('query_string', b'').decode()
        token_key = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_key = part.split('=')[1]
                break

        if not token_key:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
            self.user = token.user
        except Token.DoesNotExist:
            await self.close()
            return

        # grab the game ID from URL: ws/game/42/ -> game_id = "42"
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = f'game_{self.game_id}'

        # both players join the same group so moves reach each other
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # guard against case where connect() failed before self.game_group_name was set
        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(
                self.game_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        pass    # TODO: validate and broadcast chess moves (e.g. { "from": "e2", "to": "e4" })

    async def game_message(self, event):
        pass    # TODO: forward move updates to the browser