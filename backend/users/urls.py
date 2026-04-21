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
	path('friends/', views.get_friends),
	path('friends/<int:user_id>/', views.add_friend),
	path('friends/<int:user_id>/remove/', views.remove_friend),
    path('health/', views.health_check),
]