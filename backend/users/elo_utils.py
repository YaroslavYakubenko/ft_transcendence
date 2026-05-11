"""ELO rating calculation utilities"""

def calculate_elo_change(winner_elo, loser_elo, k_factor=32):
	"""
	Calculate ELO rating change using standard chess ELO formula.
	
	Args:
		winner_elo: Current ELO of the winner
		loser_elo: Current ELO of the loser
		k_factor: K-factor (default 32 for standard play)
	
	Returns:
		Tuple of (winner_change, loser_change)
	"""
	# Calculate expected score
	expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
	expected_loser = 1 / (1 + 10 ** ((winner_elo - loser_elo) / 400))
	
	# Calculate rating changes (1 point for win, 0 for loss)
	winner_change = k_factor * (1 - expected_winner)
	loser_change = k_factor * (0 - expected_loser)
	
	return round(winner_change), round(loser_change)


def calculate_draw_elo(player1_elo, player2_elo, k_factor=32):
	"""
	Calculate ELO rating change for a draw.
	
	Args:
		player1_elo: Current ELO of player 1
		player2_elo: Current ELO of player 2
		k_factor: K-factor (default 32)
	
	Returns:
		Tuple of (player1_change, player2_change)
	"""
	# Calculate expected score
	expected_p1 = 1 / (1 + 10 ** ((player2_elo - player1_elo) / 400))
	expected_p2 = 1 / (1 + 10 ** ((player1_elo - player2_elo) / 400))
	
	# In a draw, both players get 0.5 points
	p1_change = k_factor * (0.5 - expected_p1)
	p2_change = k_factor * (0.5 - expected_p2)
	
	return round(p1_change), round(p2_change)
