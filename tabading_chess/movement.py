import pygame
import chess
import helpers
import classes

def move(game, event, mouse_pos):
	if game.movementType == 1:
		drag_N_Drop()
	else:
		click_N_Click(game, event, mouse_pos)


def drag_N_Drop():
		pass


# manage events
def click_N_Click(game, event, mouse_pos):
	if event.type == pygame.MOUSEBUTTONDOWN :
		if game.selected == False:
			# nothing selected yet
			helpers.get_selected_tile_info(game.startP, mouse_pos, game.board, game.sq_dim)
			# print(f'pixel {game.startP.pixel}')
			# print(f'grid {game.startP.grid}')
			# print(f'sq_num {game.startP.sq_num}')
			# print(f'notation {game.startP.notation}')
			# print(f'type {game.startP.type}')
			# print(f'occ {game.startP.occ}')
			# print(f'yours {game.startP.is_your_color}')
			# print(f'legal_moves {game.startP.legal_moves}')
			if game.startP.occ == True and game.startP.is_your_color == True:
				game.selected = True
				# highlight legal moves
		else:
			# occupied space selected
			helpers.get_selected_tile_info(game.destP, mouse_pos, game.board, game.sq_dim)
			# print(f'pixel {game.destP.pixel}')
			# print(f'grid {game.destP.grid}')
			# print(f'sq_num {game.destP.sq_num}')
			# print(f'notation {game.destP.notation}')
			# print(f'type {game.destP.type}')
			# print(f'occ {game.destP.occ}')
			# print(f'yours {game.destP.is_your_color}')
			if game.destP.pixel == game.startP.pixel:
				# if same deselect
				game.selected = False
			else:
				# if diffrent, move
				if move_piece(game) == True:
					game.selected = False

					

# update board
def move_piece(game):
	move = chess.Move(game.startP.sq_num , game.destP.sq_num)
	# check legal 
	if game.destP.sq_num in game.startP.legal_moves:
		game.board.push(move)
		print(move)
		print(game.board)
		return True
	return False
		

# start working on click click with established class
# put current pos (player_pos replacement) in pieceInfo class 
# set it when clicking a piece 

# currently somewhat working movement brocken tracking
# maybe the checking is the problem ? idk its kind of mirrored
# redo compleatly 