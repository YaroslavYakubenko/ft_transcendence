# translater between Python and JSON

import re
from rest_framework import serializers
from .models import User, Friendship
from chess_app.models import Game
import os

class RegisterSerializer(serializers.ModelSerializer): # accept and password and create user
	password = serializers.CharField(write_only=True, min_length=8) # pass takes from frontend and never go back

	class Meta: #setting of serializator
		model = User #which model we will use
		fields = ('email', 'password') #fields which we take from frontend for registration

	def validate_password(self, value):
		if not re.search(r'[A-Z]', value):
			raise serializers.ValidationError("Password must contain at least one uppercase letter.")
		if not re.search(r'[0-9]', value):
			raise serializers.ValidationError("Password must contain at least one digit.")
		if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
			raise serializers.ValidationError("Password must contain at least one special character.")
		return value

	def create(self, validated_data): #method for save data
		return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer): # return the current user's data
	avatar = serializers.SerializerMethodField() #return URL from file

	class Meta:
		model = User
		fields = ('id', 'email', 'username', 'avatar', 'is_online', 'wins', 'losses', 'draws', 'elo')
		read_only_fields = ('id', 'is_online', 'wins', 'losses', 'draws', 'elo')

	def get_avatar(self, obj):
		request = self.context.get('request') # has information about current HTTP request
		if obj.avatar and request and os.path.exists(obj.avatar.path ):
			return request.build_absolute_uri(obj.avatar.url)
		# Return relative URL so frontend can use Vite proxy
		if obj.avatar:
			return obj.avatar.url
		return obj.oauth_avatar or ''

class FriendSerializer(serializers.ModelSerializer): # return the list of friends
	id = serializers.IntegerField(source='to_user.id')
	email = serializers.EmailField(source='to_user.email')
	username = serializers.CharField(source='to_user.username')
	avatar = serializers.SerializerMethodField()
	is_online = serializers.BooleanField(source='to_user.is_online')

	class Meta:
		model = Friendship
		fields = ('id', 'email', 'username', 'avatar', 'is_online')

	def get_avatar(self, obj):
		request = self.context.get('request')
		if obj.to_user.avatar and request:
			return request.build_absolute_uri(obj.to_user.avatar.url)
		return obj.to_user.oauth_avatar or ''


class UserStatsSerializer(serializers.ModelSerializer):
	"""Serializer for user statistics"""
	rank = serializers.SerializerMethodField()
	
	class Meta:
		model = User
		fields = ('id', 'username', 'wins', 'losses', 'draws', 'elo', 'rank', 'highest_win_streak')
	
	def get_rank(self, obj):
		# Calculate rank based on elo (higher elo = lower rank number)
		rank = User.objects.filter(elo__gt=obj.elo).count() + 1
		return rank


class MatchRecordSerializer(serializers.Serializer):
	"""Serializer for match history records"""
	id = serializers.IntegerField()
	opponent_name = serializers.CharField()
	result = serializers.CharField()
	date = serializers.DateTimeField()
	duration = serializers.SerializerMethodField()
	
	def get_duration(self, obj):
		if obj.get('started_at') and obj.get('ended_at'):
			delta = obj['ended_at'] - obj['started_at']
			minutes = int(delta.total_seconds() / 60)
			return f"{minutes} min"
		return "N/A"


class LeaderboardSerializer(serializers.ModelSerializer):
	"""Serializer for leaderboard entries"""
	rank = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = ('id', 'username', 'email', 'wins', 'losses', 'draws', 'elo', 'rank')
	
	def get_rank(self, obj):
		rank = User.objects.filter(elo__gt=obj.elo).count() + 1
		return rank