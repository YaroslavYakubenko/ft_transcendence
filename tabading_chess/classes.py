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

		self.b_piece_img = {
			'b_pawn' : helpers.givImg("imgs/bp.png", 100),
			'b_rook' : helpers.givImg("imgs/br.png", 100),
			'b_knight' : helpers.givImg("imgs/bn.png", 100),
			'b_bishop' : helpers.givImg("imgs/bb.png", 100),
			'b_king' : helpers.givImg("imgs/bk.png", 100),
			'b_queen' : helpers.givImg("imgs/bq.png", 100),
		}
		self.w_piece_img = {
			'w_pawn' : helpers.givImg("imgs/wp.png", 100),
			'w_rook' : helpers.givImg("imgs/wr.png", 100),
			'w_knight' : helpers.givImg("imgs/wn.png", 100),
			'w_bishop' : helpers.givImg("imgs/wb.png", 100),
			'w_king' : helpers.givImg("imgs/wk.png", 100),
			'w_queen' : helpers.givImg("imgs/wq.png", 100),
		}
		
		self.dragNdrop = True
		self.move_piece = False