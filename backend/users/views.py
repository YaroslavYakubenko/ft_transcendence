from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate # check email + password and return object or none
from .models import User, Friendship, ChatMessage
from .serializers import RegisterSerializer, UserSerializer, FriendSerializer
from chess_app.models import Game
import requests #for http request to GitHub API
import secrets
import logging
from django.conf import settings #to read our settings.py
from django.http import JsonResponse # for docker health check
from django.db import connection
from django.db import models


logger = logging.getLogger(__name__)


def _provider_error_message(response, fallback_message):
	try:
		data = response.json()
		error = data.get('error')
		description = data.get('error_description')
		if error and description:
			return f'{fallback_message}: {error} - {description}'
		if error:
			return f'{fallback_message}: {error}'
		if description:
			return f'{fallback_message}: {description}'
	except ValueError:
		pass
	text = (response.text or '').strip()
	if text:
		return f'{fallback_message}: {text[:200]}'
	return fallback_message

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
	# Prepare data for serializer (exclude avatar file, handle separately)
	data = {
		'username': request.data.get('username', request.user.username),
		'email': request.data.get('email', request.user.email),
	}
	serializer = UserSerializer(request.user, data=data, partial=True, context={'request': request}) # 1. existing user, 2. new data from frontend, 3. partial update
	if serializer.is_valid():
		serializer.save()
		# Handle avatar file upload separately (SerializerMethodField is read-only)
		if 'avatar' in request.FILES:
			request.user.avatar = request.FILES['avatar']
		# Handle password update
		password = request.data.get('password')
		if password:
			request.user.set_password(password)
		# Save all changes
		request.user.save()
		# Return fresh user data
		fresh = UserSerializer(request.user, context={'request': request})
		return Response(fresh.data)
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
	friendships = Friendship.objects.filter(from_user=request.user)
	serializer = FriendSerializer(friendships, many=True, context={'request': request})
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
	Friendship.objects.get_or_create(from_user=request.user, to_user=to_user)
	Friendship.objects.get_or_create(from_user=to_user, to_user=request.user)
	return Response(status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_friend(request, user_id):
	Friendship.objects.filter(from_user=request.user, to_user__id=user_id).delete() # search friend and delete
	return Response(status=status.HTTP_204_NO_CONTENT)

# Frontend sends recipient ID and message
# Backend checks the data and finds recipient
# Backend saves the message in ChatMessage
# Backend returns the saved message to the frontend
@api_view(['POST'])								# this endpoint only accepts POST requests
@permission_classes([IsAuthenticated])			# only logged in users can use this endpoint
def send_chat_message(request):					# when frontend calls the URL for sending chat messages, Django runs this function
	to_user_id = request.data.get('to_user_id')
	message = request.data.get('message', '').strip()

	if not to_user_id or not message:
		return Response({'error': 'Missing recipient or message'}, status=status.HTTP_400_BAD_REQUEST)
	
	try:
		recipient = User.objects.get(id=to_user_id)
	except User.DoesNotExist:
		return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)

	chat_message = ChatMessage.objects.create(
		sender=request.user,
		recipient=recipient,
		message=message,
	)

	return Response({
		'id': chat_message.id,
		'from_user_id': chat_message.sender.id,
		'to_user_id': chat_message.recipient.id,
		'message': chat_message.message,
		'created_at': chat_message.created_at,
	}, status=status.HTTP_201_CREATED)

# loads the saved chat history between the logged-in user and one friend
# request = HTTP request from the frontend
# models.Q = Django helper for making more complex database filters (sender & friend or friend & recipient)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, friend_id):
	messages = ChatMessage.objects.filter(
		models.Q(sender=request.user, recipient_id=friend_id) |
		models.Q(sender_id=friend_id, recipient=request.user)
	).order_by('created_at')

	data = []

	for msg in messages:
		data.append({
			'id': msg.id,
			'fromId': msg.sender.id,
			'toId': msg.recipient.id,
			'text': msg.message,
			'timestamp': msg.created_at.strftime('%H:%M'),
		})
	return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def oauth_login(request):
	provider = request.data.get('provider')
	code = request.data.get('code')
	state = request.data.get('state')
	redirect_uri = request.data.get('redirect_uri') or settings.OAUTH_REDIRECT_URI

	if provider not in ('github', '42'):
		return Response({'error': 'Unsupported provider'}, status=status.HTTP_400_BAD_REQUEST)
	if not code or not state:
		return Response({'error': 'Missing OAuth data'}, status=status.HTTP_400_BAD_REQUEST)

	if not state.startswith(f'{provider}:'):
		logger.warning('OAuth state format invalid for provider=%s', provider)
		return Response({'error': 'Invalid OAuth state'}, status=status.HTTP_400_BAD_REQUEST)

	if provider == 'github':
		try:
			# change code to access_token
			token_res = requests.post(
				'https://github.com/login/oauth/access_token',
				data={
					'client_id': settings.GITHUB_CLIENT_ID,
					'client_secret': settings.GITHUB_CLIENT_SECRET,
					'code': code, # one-time code
					'redirect_uri': redirect_uri,
				},
				headers={'Accept': 'application/json'},
				timeout=10,
			)
			token_res.raise_for_status()
			access_token = token_res.json().get('access_token')
		except (requests.RequestException, ValueError):
			logger.warning('GitHub token exchange failed for redirect_uri=%s', redirect_uri)
			return Response({'error': 'GitHub token request failed'}, status=status.HTTP_400_BAD_REQUEST)

		if not access_token:
			return Response({'error': 'GitHub auth failed'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			# get user's data from GitHub
			user_res = requests.get(
				'https://api.github.com/user/emails',
				headers={'Authorization': f'token {access_token}'},
				timeout=10,
			)
			user_res.raise_for_status()
			emails = user_res.json()
		except (requests.RequestException, ValueError):
			return Response({'error': 'GitHub email request failed'}, status=status.HTTP_400_BAD_REQUEST)

		email = next((e.get('email') for e in emails if e.get('primary') and e.get('verified')), None)
		if not email:
			return Response({'error': 'No verified primary email from GitHub'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			profile_res = requests.get(
				'https://api.github.com/user',
				headers={'Authorization': f'token {access_token}'},
				timeout=10,
			)
			profile_res.raise_for_status()
			avatar_url = profile_res.json().get('avatar_url', '')
		except (requests.RequestException, ValueError):
			avatar_url = ''

		# find or create user
		user, created = User.objects.get_or_create(email=email)
		if created or not user.oauth_avatar:
			user.oauth_avatar = avatar_url
		user.is_online = True
		user.save()
		token, _ = Token.objects.get_or_create(user=user)
		return Response({'token': token.key})
		
	if provider == '42':
		if not settings.FORTY_TWO_CLIENT_ID or not settings.FORTY_TWO_CLIENT_SECRET:
			logger.warning('42 OAuth credentials are not configured in backend/.env')
			return Response(
				{'error': '42 OAuth credentials are missing or invalid on the backend. Check backend/.env.'},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)
		try:
			# change code to access_token
			token_res = requests.post(
				'https://api.intra.42.fr/oauth/token',
				data={
					'grant_type': 'authorization_code',
					'client_id': settings.FORTY_TWO_CLIENT_ID,
					'client_secret': settings.FORTY_TWO_CLIENT_SECRET,
					'code': code,
					'redirect_uri': redirect_uri,
				},
				headers={'Accept': 'application/json'},
				timeout=10,
			)

			if token_res.status_code >= 400:
				message = _provider_error_message(token_res, '42 token request failed')
				logger.warning('42 token exchange failed: %s | redirect_uri=%s', message, redirect_uri)
				return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

			access_token = token_res.json().get('access_token')
		except (requests.RequestException, ValueError):
			logger.warning('42 token request exception for redirect_uri=%s', redirect_uri)
			return Response({'error': '42 token request failed'}, status=status.HTTP_400_BAD_REQUEST)

		if not access_token:
			return Response({'error': '42 auth failed'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			# get user's data from 42
			user_res = requests.get(
				'https://api.intra.42.fr/v2/me',
				headers={'Authorization': f'Bearer {access_token}'},
				timeout=10,
			)
			user_res.raise_for_status()
			user_data = user_res.json()
		except (requests.RequestException, ValueError):
			return Response({'error': '42 user request failed'}, status=status.HTTP_400_BAD_REQUEST)

		email = user_data.get('email')
		if not email:
			return Response({'error': 'No email from 42'}, status=status.HTTP_400_BAD_REQUEST)

		# find or create user
		avatar_url = user_data.get('image', {}).get('link', '')
		user, created = User.objects.get_or_create(email=email)
		if created or not user.oauth_avatar:
			user.oauth_avatar = avatar_url
		user.is_online = True
		user.save()
		token, _ = Token.objects.get_or_create(user=user)
		return Response({'token': token.key})


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_state(request):
	provider = request.query_params.get('provider')
	if provider not in ('github', '42'):
		return Response({'error': 'Unsupported provider'}, status=status.HTTP_400_BAD_REQUEST)

	nonce = secrets.token_urlsafe(24)
	state = f'{provider}:{nonce}'
	request.session[f'oauth_state_{provider}'] = state
	request.session.modified = True
	return Response({'state': state})

@api_view(['GET']) # docker health check
@permission_classes([AllowAny])
def health_check(request):
	return Response({'status': 'ok'}, status=status.HTTP_200_OK)

@api_view(['GET']) # database health check
@permission_classes([AllowAny])
def status_check(request):
        try:
                with connection.cursor() as cursor:
                        cursor.execute("SELECT 1")
                        cursor.fetchone()

                return Response(
                        {
                                "status": "ok",
                                "database": "ok",
                        },
                        status=status.HTTP_200_OK,
                )
        except Exception:
                return Response(
                        {
                                "status": "error",
                                "database": "unavailable",
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request, user_id):
	"""Get user statistics (wins, losses, draws, elo, rank)"""
	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
	
	from .serializers import UserStatsSerializer
	serializer = UserStatsSerializer(user)
	return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_history(request, user_id):
	"""Get match history for a user with pagination"""
	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
	
	# Get page number from query params
	page = request.query_params.get('page', 1)
	page_size = 10
	offset = (int(page) - 1) * page_size
	
	# Get games where this user participated
	games = Game.objects.filter(
		models.Q(white_player=user) | models.Q(black_player=user),
		status='completed'
	).order_by('-ended_at')[offset:offset+page_size]
	
	matches = []
	for game in games:
		# Determine opponent and result
		if game.white_player == user:
			opponent = game.black_player
			is_white = True
		else:
			opponent = game.white_player
			is_white = False
		
		# Determine result from user's perspective
		if game.result == 'ongoing':
			result = 'ongoing'
		elif game.result == 'draw' or game.result == 'stalemate':
			result = 'draw'
		elif (game.result == 'white_win' and is_white) or (game.result == 'black_win' and not is_white):
			result = 'win'
		else:
			result = 'loss'
		
		# Calculate duration
		duration = "N/A"
		if game.started_at and game.ended_at:
			delta = game.ended_at - game.started_at
			minutes = int(delta.total_seconds() / 60)
			duration = f"{minutes} min"
		
		matches.append({
			'id': game.id,
			'opponent_name': opponent.username or opponent.email,
			'result': result,
			'date': game.ended_at or game.created_at,
			'started_at': game.started_at,
			'ended_at': game.ended_at,
			'duration': duration,
		})
	
	from .serializers import MatchRecordSerializer
	serializer = MatchRecordSerializer(matches, many=True)
	return Response({
		'matches': serializer.data,
		'page': page,
		'page_size': page_size,
	})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
	"""Get leaderboard of top players by ELO rating"""
	limit = request.query_params.get('limit', 50)
	
	try:
		limit = int(limit)
	except ValueError:
		limit = 50
	
	# Get top players by ELO
	top_players = User.objects.filter(
		is_active=True
	).order_by('-elo')[:limit]
	
	from .serializers import LeaderboardSerializer
	serializer = LeaderboardSerializer(top_players, many=True)
	return Response({'leaderboard': serializer.data})
