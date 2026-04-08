# translater between Python and JSON

import re
from rest_framework import serializers
from .models import User, Friendship

class RegisterSerializer(serializers.ModelSerializer): # accept and password and create user
	password = serializers.CharField(write_only=True, min_length=8)

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
	class Meta:
		model = User
		fields = ('id', 'email', 'username', 'avatar', 'is_online')
		read_only_fields = ('id', 'is_online')

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
		return ''