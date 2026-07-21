from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Game(models.Model):
	"""Represents a chess game between two players"""
	STATUS_CHOICES = [
		('pending', 'Pending'),
		('ongoing', 'Ongoing'),
		('completed', 'Completed'),
	]
	
	RESULT_CHOICES = [
		('white_win', 'White Win'),
		('black_win', 'Black Win'),
		('draw', 'Draw'),
		('stalemate', 'Stalemate'),
		('ongoing', 'Ongoing'),
	]

	white_player = models.ForeignKey(User, related_name='games_as_white', on_delete=models.CASCADE, null=True, blank=True)
	black_player = models.ForeignKey(User, related_name='games_as_black', on_delete=models.CASCADE, null=True, blank=True)
	
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
	result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='ongoing')
	
	TIMER_CHOICES = [
		('none', 'No Timer'),
		('3', '3 min'),
		('5', '5+3'),
		('10', '10+5'),
	]

	timer = models.CharField(max_length=10, choices=TIMER_CHOICES, default='none')

	DIFFICULTY_CHOICES = [
    	('easy', 'Easy'),
    	('medium', 'Medium'),
    	('hard', 'Hard'),
	]
	difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
	
	current_fen = models.TextField(default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	started_at = models.DateTimeField(null=True, blank=True)
	ended_at = models.DateTimeField(null=True, blank=True)
	
	def __str__(self):
		if self.white_player:
			white = self.white_player.username or self.white_player.email

		else:
			white = "Waiting for opponent"

		if self.black_player:
			black = self.black_player.username or self.black_player.email
		else:
			black = "Waiting for opponent"

		return f"{white} vs {black}"


class Move(models.Model):
	"""Represents a single move in a chess game"""
	game = models.ForeignKey(Game, related_name='moves', on_delete=models.CASCADE)
	
	from_square = models.CharField(max_length=2)  # e.g., "e2"
	to_square = models.CharField(max_length=2)    # e.g., "e4"
	promotion_piece = models.CharField(max_length=1, blank=True, null=True)  # 'Q', 'R', 'B', 'N'
	
	fen_before = models.TextField()  # Board state before this move
	fen_after = models.TextField()   # Board state after this move
	
	move_number = models.IntegerField()  # Move sequence number
	created_at = models.DateTimeField(auto_now_add=True)
	
	class Meta:
		ordering = ['move_number']
		
	def __str__(self):
		promo = f"={self.promotion_piece}" if self.promotion_piece else ""
		return f"Game {self.game.id} Move {self.move_number}: {self.from_square}{self.to_square}{promo}"
