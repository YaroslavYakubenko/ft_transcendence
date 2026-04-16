import pygame
import chess
import helpers
import classes


def move(gg, mouse_pos, player_pos, event):
	if gg.dragNdrop == True:
		drag_N_Drop(gg, mouse_pos, player_pos, event)
	else:
		click_N_Click(gg, mouse_pos, event)


def drag_N_Drop(gg, mouse_pos, player_pos, event):

		# check if you clicked on a piece / might be unnesesarry with the piece info check
		if event.type == pygame.MOUSEBUTTONDOWN:
			if helpers.pointInRect(mouse_pos, pygame.Rect(player_pos.x, player_pos.y, 100, 100)):
				# print("click")
				gg.move_piece = True
		elif event.type == pygame.MOUSEBUTTONUP:
			# print("release")
			if gg.move_piece == True :
				if helpers.pieceInBounds(mouse_pos) == True:
					player_pos.update( helpers.snapIntoPlace(mouse_pos) )
					print(f"piece snaped into tile {player_pos}")
				else:
					player_pos.update( helpers.snapIntoPlace(gg.pp.prevTile) )
					print(f"piece snaped into prev pos {player_pos}")
			gg.move_piece = False
			gg.ColorTile.update(-1, -1)

		# update player position while moving drag'n drop
		if event.type == pygame.MOUSEMOTION and gg.move_piece == True and helpers.pieceInBounds(mouse_pos) == True:
			# print("mouse motion + mouse down true")
			player_pos.x = mouse_pos.x - 50
			player_pos.y = mouse_pos.y - 50


def click_N_Click(gg, mouse_pos, event):
	# check if you clicked on a piece
	if event.type == pygame.MOUSEBUTTONDOWN :
		gg.move_piece = not gg.move_piece
		# first click
		if gg.move_piece == True:
			gg.ColorTile = helpers.selectTile(gg.ColorTile, mouse_pos)
			helpers.getPieceInfo(gg, gg.ColorTile)
			if gg.pp.type == None:
				gg.move_piece = not gg.move_piece
				gg.ColorTile.update(-1, -1)
		# second click
		else:
			print('here')
			if helpers.pieceInBounds(mouse_pos) == True:
				gg.pp.currentPos.update( helpers.snapIntoPlace(mouse_pos) )
				print(gg.pp.prevTile , gg.pp.currentPos)
				if gg.pp.prevTile != gg.pp.currentPos:
					move_piece(gg)
				gg.ColorTile.update(-1, -1)
					

def move_piece(gg):
	f = helpers.pixelToTile(gg.pp.prevTile)
	t = helpers.pixelToTile(gg.pp.currentPos)
	f.y = 7 - f.y
	t.y = 7 - t.y
	from_s = int(chess.square(f.x, f.y))
	to_s = int(chess.square(t.x, t.y))
	print(from_s, to_s)
	# need check legal
	move = chess.Move(from_s, to_s)
	gg.board.push(move)
	print(move)
	print(gg.board)

# start working on click click with established class
# put current pos (player_pos replacement) in pieceInfo class 
# set it when clicking a piece 

# currently somewhat working movement brocken tracking
# maybe the checking is the problem ? idk its kind of mirrored
# redo compleatly 