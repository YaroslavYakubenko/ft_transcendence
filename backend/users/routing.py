from django.urls import re_path     # re_path = regex-based URL matching (like pattern matching on a string)
from . import consumers             # import our handler classes from consumers.py

# same concept as urlpatterns in urls.py, but these are WebSocket URLs instead of HTTP
websocket_urlpatterns = [
    # ws://host/ws/chat/general/ -> ChatConsumer handles it
    # (? P<room_name>\w+) = named capture group, like sscanf with a named variable
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),

    # ws://host/ws/game/42/ -> GameConsumer handles it
     # (?P<game_id>\w+) = captures the game ID from the URL, like "42" or "abc123"
    re_path(r'ws/game/(?P<game_id>\w+)/$', consumers.GameConsumer.as_asgi()),

    # ws://host/ws/status/ -> OnlineStatusConsumer handles it
    re_path(r'ws/status/$', consumers.OnlineStatusConsumer.as_asgi()),

]


# re_path 
# r'ws/chat/(?P<room_name>\w+)/$'
#      │         │         │  │ │
#      │         │         │  │ └── $ = end of string (like \0 in C string matching)
#      │         │         │  └──── + = one or more characters
#      │         │         └─────── \w = any word character [a-zA-Z0-9_]
#      │         └───────────────── ?P<room_name> = name this capture "room_name"
#      └─────────────────────────── literal path prefix