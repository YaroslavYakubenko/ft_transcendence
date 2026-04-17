
import pygame
import chess
import classes

# draw the basic bord with highlighted tile 
def draw_board(game):
	sq_p = pygame.Vector2(0, 0)
	for y in range(8):
		for x in range(8):
			if game.selected == True and game.startP.pixel == sq_p:
				pygame.draw.rect(game.screen, game.colors.highlight, pygame.Rect(*sq_p, game.sq_dim, game.sq_dim))
			elif y % 2 != 0 and x % 2 != 0:
				# uneven row uneven square
				pygame.draw.rect(game.screen, game.colors.lighter, pygame.Rect(*sq_p, game.sq_dim, game.sq_dim))
			elif y % 2 == 0 and x % 2 == 0:
				# even row even square
				pygame.draw.rect(game.screen, game.colors.lighter, pygame.Rect(*sq_p, game.sq_dim, game.sq_dim))
			sq_p.x += game.sq_dim
		pygame.draw.rect(game.screen, game.colors.menu, pygame.Rect(*sq_p, game.WIDTH - sq_p.x, game.sq_dim))
		sq_p.y += game.sq_dim
		sq_p.x = 0

	
# go through board fen top left to bottom right
# also draw legal moves 
def draw_pieces(game):
	inf = classes.SelectedTileInfo()
	sq_p = pygame.Vector2(0, 0)
	for y in range(8):
		for x in range(8):
			get_selected_tile_info(inf, sq_p, game.board, game.sq_dim)
			if inf.occ == True:
				game.screen.blit(game.piece_img[inf.type.symbol()], pygame.Rect(*sq_p, game.sq_dim, game.sq_dim))
				if game.selected == True and inf.sq_num in game.startP.legal_moves:
					pygame.draw.circle(game.screen, game.colors.lmoves, (sq_p.x + game.sq_dim / 2, sq_p.y + game.sq_dim / 2), game.sq_dim / 2, 5)	
			elif game.selected == True and inf.sq_num in game.startP.legal_moves:
				pygame.draw.circle(game.screen, game.colors.lmoves, (sq_p.x + game.sq_dim / 2, sq_p.y + game.sq_dim / 2), game.sq_dim / 4)
			
			sq_p.x += game.sq_dim

		sq_p.y += game.sq_dim
		sq_p.x = 0

def get_selected_tile_info(c_tile_inf, pix_vec, board, sq_dim):
	c_tile_inf.grid.update(int(pix_vec.x / sq_dim), int(pix_vec.y / sq_dim))
	c_tile_inf.pixel.update(c_tile_inf.grid.x * sq_dim, c_tile_inf.grid.y * sq_dim)
	c_tile_inf.sq_num = int(chess.square(c_tile_inf.grid.x, 7 - c_tile_inf.grid.y))
	c_tile_inf.notation = chess.square_name(c_tile_inf.sq_num)
	c_tile_inf.type = board.piece_at(c_tile_inf.sq_num)
	c_tile_inf.occ = c_tile_inf.type is not None

	c_tile_inf.is_your_color = False
	if c_tile_inf.occ == True:
		if board.turn == chess.WHITE:
			# white is moving
			if c_tile_inf.type.color == chess.WHITE:
				# if piece is white 
				c_tile_inf.is_your_color = True
				c_tile_inf.legal_moves = get_piece_moves(board, c_tile_inf.sq_num)
		elif c_tile_inf.type.color == chess.BLACK:
			# black moves and black piece
			c_tile_inf.is_your_color = True
			c_tile_inf.legal_moves = get_piece_moves(board, c_tile_inf.sq_num)


	# print(f'pixel {c_tile_inf.pixel}')
	# print(f'grid {c_tile_inf.grid}')
	# print(f'sq_num {c_tile_inf.sq_num}')
	# print(f'notation {c_tile_inf.notation}')
	# print(f'type {c_tile_inf.type}')
	# print(f'occ {c_tile_inf.occ}')

	

def get_piece_moves(board, square):
    return [
        move.to_square for move in board.legal_moves
        if move.from_square == square
    ]

def givImg(path, size):
	piece = pygame.image.load(path)
	piece = pygame.transform.scale(piece, (size, size))
	return piece
