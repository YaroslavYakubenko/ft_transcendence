import json                                                             # for parsing / serializing messages
from channels.generic.websocket import AsyncWebsocketConsumer           # base class - handles the WS protocol for us

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self);
        # 'scope' = metadata about this connection (user, URL, headers) — like a context struct passed to every handler
        self.user = self.scope['user']

        if not self.user.is_authenticated:  # reject anonymous users
            await self.close()              # close the Websocket connection
            return

        # pull the room name from the URL capture group we defined in routing.py
        self.room_name = self.scope['url_route']['kwargs']['room_name']

        # prefix with 'chat_' to namespace our groups - avoids name collisions with other features
        self.room_group_name = f'chat_{self.room_name}'

        # group_add = subscribe this connection to a named group
        # think of it like joining a multicast group - anything sent to the group, we receive
        await self.channel_layer.group_add(
            self.room_group_name,           # the group name (like a channel name)
            self.channel_name               # this specific connection's unique ID (assigned by Channels automatically)              
        )

        await self.accept()                 # complete the WebSocket handshake - without this, connection is rejected

    async def disconnect(self, close_code):
        # close_code: 1000 = normal, 1006 = abnormal / network drop),
        # leave the group as we stop receiving messages
        # always do this on disconnect or you'll have ghost subscribers
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
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        # database_sync_to_async = adapter between async world and sync Django ORM
        # Django's ORM (database queries) is blocking / synchronus
        # but we're in an async function - calling sync code directly would freeze everything
        # this wrapper runs the sync function in a thread pool, like offloading blocking I/O to a worker thread
        from channels.db import database_sync_to_async
        await database_sync_to_async(self._set_online)(True)    # mark online before accepting

        await self.accept()

    async def disconnect (self, close_code):
        # regardless of why they disconnected (browser closed, network dropped, etc.), mark them offline
        from channels.db import database_sync_to_async
        await database_sync_to_async(self._set_online)(False)
    
    async def receive (self, text_data):
        pass    # we don't expect any messages on this connection - client just holds it open

    def _set_online(self, status):
        # regular synchronus method - no asynch here because database_sync_to_async handles that
        # update_fields = only write these specific columns to DB, more efficient than saving the whole object
        self.user.is_online = status
        self.user.save(update_fields=['is_online']) 
