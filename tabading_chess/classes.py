import pygame
import chess
import helpers

class game:
	def __init__(self, WIDTH, HEIGHT):
		self.Color1 = (235, 236, 208)
		self.Color2 = (115, 149, 82)
		self.ColorHighlight = "coral"
		self.ColorTile = pygame.Vector2(-1, -1)
		self.screen = pygame.display.set_mode([WIDTH, HEIGHT])
		self.board = chess.Board()

		self.piece_img = {
			'p' : helpers.givImg("imgs/bp.png", 100),
			'r' : helpers.givImg("imgs/br.png", 100),
			'n' : helpers.givImg("imgs/bn.png", 100),
			'b' : helpers.givImg("imgs/bb.png", 100),
			'k' : helpers.givImg("imgs/bk.png", 100),
			'q' : helpers.givImg("imgs/bq.png", 100),

			'P' : helpers.givImg("imgs/wp.png", 100),
			'R' : helpers.givImg("imgs/wr.png", 100),
			'N' : helpers.givImg("imgs/wn.png", 100),
			'B' : helpers.givImg("imgs/wb.png", 100),
			'K' : helpers.givImg("imgs/wk.png", 100),
			'Q' : helpers.givImg("imgs/wq.png", 100),
		}
		
		self.dragNdrop = False
		self.move_piece = False

		self.WIDTH = 1000
		self.HEIGHT = 800
		self.pp = pieceInfo()


class pieceInfo:
	def __init__(self):
		self.prevTile = pygame.Vector2(-1, -1)
		self.type = ''
		# might only be needed for drag'n drop
		self.currentPos = pygame.Vector2(-1, -1)
