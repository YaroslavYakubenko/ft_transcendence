from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
import chess

from users.models import User
from .models import Game
from .game_results import get_game_result


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
		self.assertTrue(game.black_player.is_bot)
		self.assertEqual(game.black_player.username, "Chess Bot")
		self.assertEqual(game.black_player.oauth_avatar, "/imgs/bk.png")

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

	def test_make_move_returns_and_saves_bot_reply(self):
		create_response = self.client.post(
			"/create-game/",
			{"opponent": "bot", "difficulty": "medium"},
			format="json",
		)
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		game = Game.objects.get(id=create_response.data["game_id"])

		move_response = self.client.post(
			"/make-move/",
			{
				"fen": game.current_fen,
				"from": "e2",
				"to": "e4",
				"game_id": game.id,
			},
			format="json",
		)

		self.assertEqual(move_response.status_code, status.HTTP_200_OK)
		self.assertIn("bot_move", move_response.data)
		self.assertNotEqual(move_response.data["bot_move"], "")

		game.refresh_from_db()
		self.assertEqual(game.moves.count(), 2)
		self.assertEqual(game.moves.last().from_square, move_response.data["bot_move"][:2])


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
		self.assertTrue(response.data["game_over"])
		self.assertEqual(response.data["result"]["winner"], "black")
		self.assertEqual(response.data["result"]["termination"], "resignation")
		self.assertEqual(response.data["result"]["pgn_result"], "0-1")
		
		# Verify game status
		self.game.refresh_from_db()
		self.assertEqual(self.game.status, "completed")
		self.assertEqual(self.game.result, "black_win")
		
		# Verify stats updated
		self.white_player.refresh_from_db()
		self.black_player.refresh_from_db()
		self.assertEqual(self.white_player.losses, 1)
		self.assertEqual(self.black_player.wins, 1)


class PromotionGameTests(APITestCase):
	def setUp(self):
		self.password = "StrongPass123!"
		self.white_player = User.objects.create_user(
			email="white@example.com", password=self.password, username="white"
		)
		self.black_player = User.objects.create_user(
			email="black@example.com", password=self.password, username="black"
		)
		self.game = Game.objects.create(
			white_player=self.white_player,
			black_player=self.black_player,
			status="ongoing",
			result="ongoing",
		)
		login_response = self.client.post(
			"/api/auth/login/",
			{"email": self.white_player.email, "password": self.password},
			format="json",
		)
		self.token = login_response.data["token"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

	def test_do_promotion_saves_move_for_game(self):
		response = self.client.post(
			"/do-promotion/",
			{
				"fen": "4k3/4P3/8/8/8/8/8/4K3 w - - 0 1",
				"move": "e7e8",
				"from": "e7",
				"to": "e8",
				"key": "q",
				"game_id": self.game.id,
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("fen", response.data)

		move = self.game.moves.get()
		self.assertEqual(move.game_id, self.game.id)
		self.assertEqual(move.from_square, "e7")
		self.assertEqual(move.to_square, "e8")
		self.assertEqual(move.promotion_piece, "Q")

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
		self.assertTrue(response.data["game_over"])
		self.assertEqual(response.data["result"]["winner"], "white")
		self.assertEqual(response.data["result"]["termination"], "resignation")
		self.assertEqual(response.data["result"]["pgn_result"], "1-0")
		
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


class GameResultHelperTests(APITestCase):
	def test_get_game_result_detects_stalemate(self):
		board = chess.Board("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1")
		result = get_game_result(board)

		self.assertIsNotNone(result)
		self.assertEqual(result["winner"], None)
		self.assertEqual(result["termination"], "stalemate")
		self.assertEqual(result["pgn_result"], "1/2-1/2")
