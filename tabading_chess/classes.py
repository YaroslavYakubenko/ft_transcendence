import pygame

class game:
	def __init__(self, WIDTH, HEIGHT):
		self.Color1 = (235, 236, 208)
		self.Color2 = (115, 149, 82)
		self.ColorHighlight = "coral"
		self.ColorTile = pygame.Vector2(-1, -1)
		self.screen = pygame.display.set_mode([WIDTH, HEIGHT])

		# self.w_piece_pos = {
		# 	'wp1' : (0, 600),
		# 	'wp2' : (100, 600),
		# 	'wp3' : (200, 600),
		# 	'wp4' : (300, 600),
		# 	'wp5' : (400, 600),
		# 	'wp6' : (500, 600),
		# 	'wp7' : (600, 600),
		# 	'wp8' : (700, 600),
		# 	'wr1' : (0, 700),
		# 	'wk1' : (100, 700),
		# 	'wb1' : (200, 700),
		# 	'wk' : (300, 700),
		# 	'wq' : (400, 700),
		# 	'wb2' : (500, 700),
		# 	'wk2' : (600, 700),
		# 	'wr2' : (700, 700)
		# }