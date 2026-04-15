import pygame
import chess
import helpers
import classes


def move(gg, mouse_pos, player_pos, event):
	if gg.dragNdrop == True:
		drag_N_Drop(gg, mouse_pos, player_pos, event)
	else:
		click_N_Click(gg)


def drag_N_Drop(gg, mouse_pos, player_pos, event):

		# check if you clicked on a piece
		if event.type == pygame.MOUSEBUTTONDOWN:
			if helpers.pointInRect(mouse_pos, pygame.Rect(player_pos.x, player_pos.y, 100, 100)):
				print("mouse down in square")
				gg.move_piece = True
		elif event.type == pygame.MOUSEBUTTONUP:
			print("mouse up")
			if gg.move_piece == True:
				player_pos.update( helpers.snapIntoPlace(mouse_pos) )
				print(f"piece snaped into tile {player_pos}")
			gg.move_piece = False
			gg.ColorTile.update(-1, -1)

		# update player position while moving drag'n drop
		if event.type == pygame.MOUSEMOTION and gg.move_piece == True:
			print("mouse motion + mouse down true")
			player_pos.x = mouse_pos.x - 50
			player_pos.y = mouse_pos.y - 50


def click_N_Click(gg):
	pass