
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
		# draw menu
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


def game_over(game):
	outcome = game.board.outcome()
	game.game_over_data = get_game_over_messages(outcome)
	draw_game_over_menu(game)

# def get_res(game, outcome):
# 	res = ''
# 	if outcome is not None:
# 		if outcome.winner is True:
# 			print("White wins")
# 			res = "White wins"
# 		elif outcome.winner is False:
# 			print("Black wins")
# 			res = "Black wins"
# 		else:
# 			print("Draw")
# 			res = "Draw"
# 		# returns a string in chess notation: "1-0" → White wins, "0-1" → Black wins, "1/2-1/2" → Draw
# 		print(outcome.result())
# 	return res

def get_game_over_messages(outcome):
	if outcome is None:
		return None
	
	reason_map = {
		"CHECKMATE": "by Checkmate",
		"STALEMATE": "by Stalemate",
		"INSUFFICIENT_MATERIAL": "by Insufficient Material",
		"THREEFOLD_REPETITION": "by Threefold Repetition",
		"FIFTY_MOVES": "by Fifty Moves Rule",
		"TIME_FORFEIT": "on time",
		"RESIGNATION": "by resignation"
	}

	# Main result message
	if outcome.winner is True:
		main_message = "White wins"
	elif outcome.winner is False:
		main_message = "Black wins"
	else:
		main_message = "Draw"

	# Outcome reason message
	reason_text = reason_map.get(
		outcome.termination.name, 
		outcome.termination.name.replace("_", " ").lower()
	)

	#PGN result string
	pgn_result = outcome.result()

	return {
		"result": main_message,
		"reason": reason_text,
		"pgn": pgn_result
	}

def draw_text(game, size, cx, cy, color, stri, op):
	font = pygame.font.SysFont(None, size)
	center_point = (cx, cy)
	text_surface = font.render(stri, True, color)
	if op == 0:
		text_rect = text_surface.get_rect(center=center_point)
	else:
		text_rect = text_surface.get_rect(midtop=center_point)

	game.screen.blit(text_surface, text_rect)

# pygame.Rect(x pos, y pos, width, height), radius)
# res = string
def draw_game_over_menu(game):

    menu = game.gameover_menu

    pygame.draw.rect(game.screen, game.colors.menu, menu.base)

    data = game.game_over_data
    if not data:
        return

    pygame.draw.rect(game.screen, game.colors.highlight, menu.high_button, border_radius=25)
    pygame.draw.rect(game.screen, game.colors.menu_button, menu.l_button, border_radius=20)
    pygame.draw.rect(game.screen, game.colors.menu_button, menu.r_button, border_radius=20)

    draw_text(
        game,
        100,
        menu.upper_display.x + menu.upper_display.width / 2,
        menu.upper_display.y,
        "white",
        data["result"],
        1
    )

    draw_text(
        game,
        50,
        menu.upper_display.x + menu.upper_display.width / 2,
        menu.upper_display.y + 70,
        "gray60",
        data["reason"],
        1
    )

    draw_text(
        game,
        30,
        menu.upper_display.x + menu.upper_display.width / 2,
        menu.upper_display.y + 120,
        "gray40",
        data["pgn"],
        1
    )

    draw_text(
        game,
        80,
        menu.high_button.x + menu.high_button.width / 2,
        menu.high_button.y + menu.high_button.height / 2,
        "white",
        "Leaderboard",
        0
    )

    draw_text(
        game,
        40,
        menu.l_button.x + menu.l_button.width / 2,
        menu.l_button.y + menu.l_button.height / 2,
        "gray60",
        "New Game",
        0
    )

    draw_text(
        game,
        40,
        menu.r_button.x + menu.r_button.width / 2,
        menu.r_button.y + menu.r_button.height / 2,
        "gray60",
        "Rematch",
        0
    )

def check_menu_click(game, menu, mouse_pos):
	if menu.high_button.collidepoint(mouse_pos):
		print("clicked leaderboard button")
	elif menu.l_button.collidepoint(mouse_pos):
		print("clicked new game button")
	elif menu.r_button.collidepoint(mouse_pos):
		print("clicked rematch button")
	