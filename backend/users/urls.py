#routing

from django.urls import path
from . import views

urlpatterns = [
	path('auth/register/', views.register),
	path('auth/login/', views.login),
	path('auth/me/', views.me),
	path('auth/logout/', views.logout),
	path('auth/oauth/state/', views.oauth_state),
	path('auth/oauth/', views.oauth_login),

	path('users/me/', views.update_me),
	path('users/<int:user_id>/', views.get_user),
	path('users/me/delete/', views.delete_me),
	path('users/<int:user_id>/stats/', views.get_user_stats, name='user_stats'),
	path('users/<int:user_id>/matches/', views.get_match_history, name='match_history'),

	path('friends/', views.get_friends),
	path('friends/<int:user_id>/', views.add_friend),
	path('friends/<int:user_id>/remove/', views.remove_friend),

	path('chat/send/', views.send_chat_message),									# POST /api/chat/send/ calls send_chat_message()
	path('chat/<int:friend_id>/', views.get_chat_messages),							# GET /api/chat/2/ calls get_chat_messages()

	path('leaderboard/', views.get_leaderboard, name='leaderboard'),
	path('health/', views.health_check),
	path('status/', views.status_check),
]

# Endpoint = a backend URL connected to a function 
# POST request means: Frontend sends data to the backend