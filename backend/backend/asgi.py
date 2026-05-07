"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter      # routers = like a switch / case on connection ty
from channels.auth import AuthMiddlewareStack                   # middleware = wraps handler, like a decorator in C++
import users.routing                                            # our WebSocket URL table (like a routing table)


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# ProtocolTypeRouter = the front door - decides WHERE to send each connection based on its TYPE
application = ProtocolTypeRouter({
    'http': get_asgi_application(),                 # HTTP requests go to the normal Django handler (same as before)
    'websocket': AuthMiddlewareStack(               # WebSocket connections get wrapped with auth first
        URLRouter(                                  # then matched against URL patterns (like urls.py for WS)
            users.routing.websocket_urlpatterns     # the acutal list of ws:// URLs defined
        )
    ),
})