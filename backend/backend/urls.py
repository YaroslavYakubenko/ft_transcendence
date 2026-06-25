"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings # access to settings (MEDIA_URL, MEDIA_ROOT)
from django.conf.urls.static import static #function for distributing media files
from chess_app.views import make_move, do_promotion, legal_moves, check_color, check_game_status
from chess_app.views import resign_game
from chess_app.views import create_game

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')), # pass everything to users.urls
    path('make-move/', make_move, name='make_move'),
    path('do-promotion/', do_promotion, name='do_promotion'),
    path('legal-moves/', legal_moves, name='legal_moves'),
    path('create-game/', create_game, name='create_game'),
    path('resign/', resign_game, name='resign_game'),
    path('check-color/', check_color, name='check_color'),
    path('check-game-status/', check_game_status, name='check_game_status'),

	
    path('', include('django_prometheus.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) # dustribute downloaded files by URL

