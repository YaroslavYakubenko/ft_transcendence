from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate # check email + password and return object or none
from .models import User, Friendship
from .serializers import RegisterSerializer, UserSerializer, FriendSerializer
import requests #for http request to GitHub API
from django.conf import settings #to read our settings.py

@api_view(['POST']) #API endpoint takes only POST
@permission_classes([AllowAny]) # allow any, says who can use endpoint
def register(request):
	serializer = RegisterSerializer(data=request.data)
	if serializer.is_valid(): #check email and password are correct
		user = serializer.save() # create user in DB
		token, _ = Token.objects.get_or_create(user=user) # create token for new user or get old one
		return Response({'token': token.key}, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
	email = request.data.get('email') #get email from JSON request, frontend sent
	password = request.data.get('password')
	user = authenticate(request, username=email, password=password) #check email and password, return user or none
	if user is None:
		return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
	user.is_online = True
	user.save()
	token, _ = Token.objects.get_or_create(user=user)
	return Response({'token': token.key})

@api_view(['GET'])
@permission_classes([IsAuthenticated]) #only authenticated user
def me(request):
	serializer = UserSerializer(request.user, context={'request': request})
	return Response(serializer.data) # dictionary {id, email, username, avatar, is_online}

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
	request.user.auth_token.delete()
	request.user.is_online = False
	request.user.save()
	return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['PATCH']) # partial update
@permission_classes([IsAuthenticated])
def update_me(request):
	data = request.data.copy()
	if 'avatar' in request.FILES:
		data['avatar'] = request.FILES['avatar']
	serializer = UserSerializer(request.user, data=data, partial=True, context={'request': request}) # 1. existing user, 2. new data from frontend, 3. partial update
	if serializer.is_valid():
		serializer.save()
		password = request.data.get('password')
		if password:
			request.user.set_password(password)
			request.user.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_me(request):
	request.user.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, user_id): # view someone else's profile
	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
	serializer = UserSerializer(user, context={'request': request})
	return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request): # view who added whom
	friendships = Friendship.objects.filter(from_user=request.user) # search all friends
	serializer = FriendSerializer(friendships, many=True, context={'request': request}) # many=True is a list, converts 
	return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_friend(request, user_id):
	try:
		to_user = User.objects.get(id=user_id) # search user by id
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
	if to_user == request.user:
		return Response({'error': 'Cannot add yourself'}, status=status.HTTP_400_BAD_REQUEST)
	Friendship.objects.get_or_create(from_user=request.user, to_user=to_user) # create friendship in DB
	return Response(status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_friend(request, user_id):
	Friendship.objects.filter(from_user=request.user, to_user__id=user_id).delete() # search friend and delete
	return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([AllowAny])
def oauth_login(request):
	provider = request.data.get('provider')
	code = request.data.get('code')
	if provider == 'github':
		# change code to access_token
		token_res = requests.post(
			'https://github.com/login/oauth/access_token',
			json={
				'client_id': settings.GITHUB_CLIENT_ID,
				'client_secret': settings.GITHUB_CLIENT_SECRET,
				'code': code, # one-time code
			},
			headers={'Accept': 'application/json'}
		)
		access_token = token_res.json().get('access_token')
		if not access_token:
			return Response({'error': 'GitHub auth failed'}, status=status.HTTP_400_BAD_REQUEST)
		# get user's data from GitHub
		user_res = requests.get(
			'https://api.github.com/user/emails',
			headers={'Authorization': f'token {access_token}'}
		)
		emails = user_res.json()
		email = next((e['email'] for e in emails if e['primary']), None)
		if not email:
			return Response({'error': 'No email from GitHub'}, status=status.HTTP_400_BAD_REQUEST)

		profile_res = requests.get(
			'https://api.github.com/user',
			headers={'Authorization': f'token {access_token}'}
		)
		avatar_url = profile_res.json().get('avatar_url', '')

		# find or create user
		user, created = User.objects.get_or_create(email=email)
		if created or not user.oauth_avatar:
			user.oauth_avatar = avatar_url
		user.is_online = True
		user.save()
		token, _ = Token.objects.get_or_create(user=user)
		return Response({'token': token.key})
		
	if provider == '42':
		# change code to access_token
		token_res = requests.post(
			'https://api.intra.42.fr/oauth/token',
			json={
				'grant_type': 'authorization_code',
				'client_id': settings.FORTY_TWO_CLIENT_ID,
				'client_secret': settings.FORTY_TWO_CLIENT_SECRET,
				'code': code,
				'redirect_uri': 'http://localhost:5173/oauth/callback',
			}
		)
		access_token = token_res.json().get('access_token')
		if not access_token:
			return Response({'error': '42 auth failed'}, status=status.HTTP_400_BAD_REQUEST)
		# get user's data from 42
		user_res = requests.get(
			'https://api.intra.42.fr/v2/me',
			headers={'Authorization': f'Bearer {access_token}'}
		)
		email = user_res.json().get('email')
		if not email:
			return Response({'error': 'No email from 42'}, status=status.HTTP_400_BAD_REQUEST)

		# find or create user
		avatar_url = user_res.json().get('image', {}).get('link', '')
		user, created = User.objects.get_or_create(email=email)
		if created or not user.oauth_avatar:
			user.oauth_avatar = avatar_url
		user.is_online = True
		user.save()
		token, _ = Token.objects.get_or_create(user=user)
		return Response({'token': token.key})
	return Response({'error': 'Unsupported provider'}, status=status.HTTP_400_BAD_REQUEST)