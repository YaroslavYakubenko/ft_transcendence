from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from .models import User, Friendship
from chess_app.models import Game
from chess_app.views import _get_bot_user


class HealthCheckTests(APITestCase):
	def test_health_endpoint_returns_ok(self):
		response = self.client.get("/api/health/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, {"status": "ok"})

class StatusCheckTests(APITestCase):
        def test_status_endpoint_returns_ok(self):
                response = self.client.get("/api/status/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(
                        response.data,
                        {
                                "status": "ok",
                                "database": "ok",
                        },
                )

class AuthFlowTests(APITestCase):
	def test_register_then_me(self):
		register_payload = {
			"email": "newuser@example.com",
			"password": "StrongPass123!",
			"username": "newuser",
		}
		register_response = self.client.post(
			"/api/auth/register/", register_payload, format="json"
		)
		self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
		self.assertIn("token", register_response.data)

		token = register_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
		me_response = self.client.get("/api/auth/me/")

		self.assertEqual(me_response.status_code, status.HTTP_200_OK)
		self.assertEqual(me_response.data["email"], register_payload["email"])

	def test_login_with_valid_credentials(self):
		password = "StrongPass123!"
		user = User.objects.create_user(
			email="loginuser@example.com", password=password, username="loginuser"
		)
		response = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": password},
			format="json",
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("token", response.data)


class BotProfileTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user = User.objects.create_user(
			email="viewer@example.com", password=self.password, username="viewer"
		)
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user.email, "password": self.password},
			format="json",
		)
		token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

	def test_bot_profile_is_always_online(self):
		bot = _get_bot_user()
		bot.is_online = False
		bot.save(update_fields=["is_online"])

		response = self.client.get(f"/api/users/{bot.id}/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data["is_bot"])
		self.assertTrue(response.data["is_online"])

		friend_response = self.client.get("/api/friends/")
		self.assertEqual(friend_response.status_code, status.HTTP_200_OK)


class FriendshipTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user_a = User.objects.create_user(
			email="a@example.com", password=self.password, username="usera"
		)
		self.user_b = User.objects.create_user(
			email="b@example.com", password=self.password, username="userb"
		)

		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user_a.email, "password": self.password},
			format="json",
		)
		token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

	def test_add_and_remove_friend(self):
		add_response = self.client.post(f"/api/friends/{self.user_b.id}/")
		self.assertEqual(add_response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(
			Friendship.objects.filter(from_user=self.user_a, to_user=self.user_b).exists()
		)

		list_response = self.client.get("/api/friends/")
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(list_response.data), 1)

		remove_response = self.client.delete(f"/api/friends/{self.user_b.id}/remove/")
		self.assertEqual(remove_response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(
			Friendship.objects.filter(from_user=self.user_a, to_user=self.user_b).exists()
		)


class UserStatsTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user = User.objects.create_user(
			email="statsuser@example.com", password=self.password, username="statsuser"
		)
		self.opponent = User.objects.create_user(
			email="opponent@example.com", password=self.password, username="opponent"
		)
		
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user.email, "password": self.password},
			format="json",
		)
		token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

	def test_get_user_stats_initial(self):
		"""Test that a new user has default stats"""
		response = self.client.get(f"/api/users/{self.user.id}/stats/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		data = response.data
		self.assertEqual(data['wins'], 0)
		self.assertEqual(data['losses'], 0)
		self.assertEqual(data['draws'], 0)
		self.assertEqual(data['elo'], 1200)

	def test_get_user_stats_after_wins(self):
		"""Test stats update after wins"""
		self.user.wins = 5
		self.user.losses = 2
		self.user.draws = 1
		self.user.elo = 1350
		self.user.save()
		
		response = self.client.get(f"/api/users/{self.user.id}/stats/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		data = response.data
		self.assertEqual(data['wins'], 5)
		self.assertEqual(data['losses'], 2)
		self.assertEqual(data['draws'], 1)
		self.assertEqual(data['elo'], 1350)

	def test_get_nonexistent_user_stats(self):
		"""Test that requesting stats for non-existent user returns 404"""
		response = self.client.get(f"/api/users/99999/stats/")
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_user_rank_calculation(self):
		"""Test that rank is calculated correctly"""
		# Create users with different ELOs
		user_high = User.objects.create_user(
			email="high@example.com", password=self.password, username="high"
		)
		user_high.elo = 1600
		user_high.save()
		
		user_mid = User.objects.create_user(
			email="mid@example.com", password=self.password, username="mid"
		)
		user_mid.elo = 1400
		user_mid.save()
		
		# Get stats for mid user
		response = self.client.get(f"/api/users/{user_mid.id}/stats/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		# Mid user should be rank 2 (high user is rank 1)
		self.assertEqual(response.data['rank'], 2)


class MatchHistoryTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user = User.objects.create_user(
			email="historyuser@example.com", password=self.password, username="historyuser"
		)
		self.opponent = User.objects.create_user(
			email="opponent2@example.com", password=self.password, username="opponent2"
		)
		
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user.email, "password": self.password},
			format="json",
		)
		token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

	def test_match_history_empty(self):
		"""Test that new user has empty match history"""
		response = self.client.get(f"/api/users/{self.user.id}/matches/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data['matches']), 0)

	def test_match_history_with_games(self):
		"""Test match history with completed games"""
		now = timezone.now()
		
		# Create a completed game where user is white and wins
		game1 = Game.objects.create(
			white_player=self.user,
			black_player=self.opponent,
			status='completed',
			result='white_win',
			started_at=now - timedelta(hours=1),
			ended_at=now,
		)
		
		# Create a completed game where user is black and loses
		game2 = Game.objects.create(
			white_player=self.opponent,
			black_player=self.user,
			status='completed',
			result='white_win',
			started_at=now - timedelta(hours=2),
			ended_at=now - timedelta(hours=1, minutes=30),
		)
		
		response = self.client.get(f"/api/users/{self.user.id}/matches/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		matches = response.data['matches']
		self.assertEqual(len(matches), 2)
		
		# First game should be the most recent
		self.assertEqual(matches[0]['result'], 'win')
		self.assertEqual(matches[0]['opponent_name'], 'opponent2')
		
		# Second game should be a loss
		self.assertEqual(matches[1]['result'], 'loss')

	def test_match_history_duration_calculation(self):
		"""Test that game duration is calculated correctly"""
		now = timezone.now()
		start_time = now - timedelta(minutes=15)
		
		game = Game.objects.create(
			white_player=self.user,
			black_player=self.opponent,
			status='completed',
			result='draw',
			started_at=start_time,
			ended_at=now,
		)
		
		response = self.client.get(f"/api/users/{self.user.id}/matches/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		matches = response.data['matches']
		self.assertEqual(len(matches), 1)
		self.assertEqual(matches[0]['duration'], '15 min')


class LeaderboardTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user = User.objects.create_user(
			email="leaderboard@example.com", password=self.password, username="leaderboard"
		)
		
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user.email, "password": self.password},
			format="json",
		)
		token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

	def test_leaderboard_returns_sorted_by_elo(self):
		"""Test that leaderboard is sorted by ELO in descending order"""
		# Create users with different ELOs
		users_data = [
			("user1@example.com", "user1", 1500),
			("user2@example.com", "user2", 1800),
			("user3@example.com", "user3", 1300),
			("user4@example.com", "user4", 1600),
		]
		
		for email, username, elo in users_data:
			user = User.objects.create_user(email=email, password=self.password, username=username)
			user.elo = elo
			user.save()
		
		response = self.client.get("/api/leaderboard/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		leaderboard = response.data['leaderboard']
		
		# Check that it's sorted by ELO descending
		for i in range(len(leaderboard) - 1):
			self.assertGreaterEqual(leaderboard[i]['elo'], leaderboard[i+1]['elo'])

	def test_leaderboard_rank_calculation(self):
		"""Test that ranks are calculated correctly in leaderboard"""
		users_data = [
			("high@example.com", "high", 1600),
			("mid@example.com", "mid", 1400),
			("low@example.com", "low", 1200),
		]
		
		for email, username, elo in users_data:
			user = User.objects.create_user(email=email, password=self.password, username=username)
			user.elo = elo
			user.save()
		
		response = self.client.get("/api/leaderboard/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		leaderboard = response.data['leaderboard']
		
		# Find entries and check ranks
		for entry in leaderboard:
			if entry['username'] == 'high':
				self.assertEqual(entry['rank'], 1)
			elif entry['username'] == 'mid':
				self.assertEqual(entry['rank'], 2)
			elif entry['username'] == 'low':
				self.assertEqual(entry['rank'], 3)

	def test_leaderboard_limit_parameter(self):
		"""Test that limit parameter works"""
		# Create 15 users
		for i in range(15):
			user = User.objects.create_user(
				email=f"user{i}@example.com",
				password=self.password,
				username=f"user{i}"
			)
			user.elo = 1200 + (i * 10)
			user.save()
		
		# Request with limit=5
		response = self.client.get("/api/leaderboard/?limit=5")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		leaderboard = response.data['leaderboard']
		self.assertLessEqual(len(leaderboard), 5)
