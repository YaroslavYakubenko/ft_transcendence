from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from users.models import User
from .models import Game


class CreateGameTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.user = User.objects.create_user(
			email="player@example.com", password=self.password, username="player"
		)
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.user.email, "password": self.password},
			format="json",
		)
		self.token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

	def test_create_bot_game_returns_game_id(self):
		response = self.client.post(
			"/create-game/",
			{"opponent": "bot"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn("game_id", response.data)

		game = Game.objects.get(id=response.data["game_id"])
		self.assertEqual(game.white_player, self.user)
		self.assertEqual(game.black_player.email, "chess-bot@transcendence.local")
		self.assertEqual(game.status, "pending")

	def test_create_live_game_requires_opponent_id(self):
		response = self.client.post(
			"/create-game/",
			{"opponent": "live"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_create_game_requires_authentication(self):
		self.client.credentials()
		response = self.client.post(
			"/create-game/",
			{"opponent": "bot"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ResignGameTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.white_player = User.objects.create_user(
			email="white@example.com", password=self.password, username="white"
		)
		self.black_player = User.objects.create_user(
			email="black@example.com", password=self.password, username="black"
		)
		
		# Create a game
		self.game = Game.objects.create(
			white_player=self.white_player,
			black_player=self.black_player,
			status='ongoing',
			result='ongoing'
		)
		
		# Login as white player
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.white_player.email, "password": self.password},
			format="json",
		)
		self.token_white = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token_white}")

	def test_white_player_resigns(self):
		"""Test that white player can resign and black wins"""
		response = self.client.post(
			"/resign/",
			{"game_id": self.game.id},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["result"], "black_win")
		
		# Verify game status
		self.game.refresh_from_db()
		self.assertEqual(self.game.status, "completed")
		self.assertEqual(self.game.result, "black_win")
		
		# Verify stats updated
		self.white_player.refresh_from_db()
		self.black_player.refresh_from_db()
		self.assertEqual(self.white_player.losses, 1)
		self.assertEqual(self.black_player.wins, 1)

	def test_black_player_resigns(self):
		"""Test that black player can resign and white wins"""
		# Login as black player
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.black_player.email, "password": self.password},
			format="json",
		)
		token_black = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token_black}")
		
		response = self.client.post(
			"/resign/",
			{"game_id": self.game.id},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["result"], "white_win")
		
		# Verify game status
		self.game.refresh_from_db()
		self.assertEqual(self.game.status, "completed")
		self.assertEqual(self.game.result, "white_win")
		
		# Verify stats updated
		self.white_player.refresh_from_db()
		self.black_player.refresh_from_db()
		self.assertEqual(self.black_player.losses, 1)
		self.assertEqual(self.white_player.wins, 1)

	def test_non_player_cannot_resign(self):
		"""Test that a user who is not in the game cannot resign"""
		third_user = User.objects.create_user(
			email="third@example.com", password=self.password, username="third"
		)
		
		# Login as third user
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": third_user.email, "password": self.password},
			format="json",
		)
		token_third = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token_third}")
		
		response = self.client.post(
			"/resign/",
			{"game_id": self.game.id},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_cannot_resign_completed_game(self):
		"""Test that a completed game cannot be resigned"""
		# Mark game as completed
		self.game.status = "completed"
		self.game.result = "white_win"
		self.game.ended_at = timezone.now()
		self.game.save()
		
		response = self.client.post(
			"/resign/",
			{"game_id": self.game.id},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_resign_nonexistent_game(self):
		"""Test that resigning from non-existent game returns 404"""
		response = self.client.post(
			"/resign/",
			{"game_id": 99999},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_elo_updated_on_resign(self):
		"""Test that ELO ratings are updated when resigning"""
		# Set initial ELO
		self.white_player.elo = 1600
		self.white_player.save()
		self.black_player.elo = 1200
		self.black_player.save()
		
		initial_white_elo = self.white_player.elo
		initial_black_elo = self.black_player.elo
		
		response = self.client.post(
			"/resign/",
			{"game_id": self.game.id},
			format="json",
		)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		
		# Verify ELO changed
		self.white_player.refresh_from_db()
		self.black_player.refresh_from_db()
		
		# White (higher rated) lost, should lose less ELO
		# Black (lower rated) won, should gain more ELO
		self.assertLess(self.white_player.elo, initial_white_elo)
		self.assertGreater(self.black_player.elo, initial_black_elo)
