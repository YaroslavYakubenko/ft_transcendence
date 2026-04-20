import pygame
import chess
import helpers

class game:
	def __init__(self, WIDTH, HEIGHT, sq_size):
		#  ---- constant for now ----------------------
		self.WIDTH = WIDTH
		self.HEIGHT = HEIGHT
		self.sq_dim = sq_size
		
		self.screen = pygame.display.set_mode([WIDTH, HEIGHT])
		self.colors = Colors()
		# 0 == click click | 1 == drag'n drop
		self.movementType = 0

		# if customizable later might need to change access
		self.piece_img = {
			'p' : helpers.givImg("imgs/bp.png", sq_size),
			'r' : helpers.givImg("imgs/br.png", sq_size),
			'n' : helpers.givImg("imgs/bn.png", sq_size),
			'b' : helpers.givImg("imgs/bb.png", sq_size),
			'k' : helpers.givImg("imgs/bk.png", sq_size),
			'q' : helpers.givImg("imgs/bq.png", sq_size),

			'P' : helpers.givImg("imgs/wp.png", sq_size),
			'R' : helpers.givImg("imgs/wr.png", sq_size),
			'N' : helpers.givImg("imgs/wn.png", sq_size),
			'B' : helpers.givImg("imgs/wb.png", sq_size),
			'K' : helpers.givImg("imgs/wk.png", sq_size),
			'Q' : helpers.givImg("imgs/wq.png", sq_size),
		}
		
		#  ---- used and updated ----------------
		# is something selected
		self.selected = False 

		# chess Fen 
		self.board = chess.Board()
		self.pp = PieceInfo()
		self.startP = SelectedTileInfo()
		self.destP = SelectedTileInfo()


class PieceInfo:
	def __init__(self):
		self.type = ''
		# check if white or black move in fen -> only move if true
		self.myPiece = False
		# maybe put legal moves here later?

class SelectedTileInfo():
	def __init__(self):
		# (0, 0) (0, 100) etc
		self.pixel = pygame.Vector2(-1, -1)
		# (0, 0) (0, 1) etc
		self.grid = pygame.Vector2(-1, -1)
		# 56 57 etc
		self.sq_num = -1
		# a8 b8 etc
		self.notation = ''
		# occupied
		self.occ = False
		self.type = ''
		self.is_your_color = False
		self.legal_moves = []



class Colors():
	def __init__(self):
		self.lighter = (235, 236, 208)
		self.base = (115, 149, 82)
		self.highlight = "coral"
		self.menu = 'grey22'
		self.menu_button = 'grey30'
		self.lmoves = 'coral'