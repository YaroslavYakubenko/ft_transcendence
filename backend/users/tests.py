from rest_framework import status
from rest_framework.test import APITestCase

from .models import User, Friendship


class HealthCheckTests(APITestCase):
	def test_health_endpoint_returns_ok(self):
		response = self.client.get("/api/health/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, {"status": "ok"})


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
