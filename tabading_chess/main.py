
import pygame
import chess
import helpers
import classes

# board = chess.Board()
# print(board)
# print("")
# move = chess.Move.from_uci("e2e4")
# if move in board.legal_moves:
#     board.push(move)
# print(board)


pygame.init()
WIDTH = 1000
HEIGHT = 800
gg = classes.game(WIDTH, HEIGHT)
clock = pygame.time.Clock()
dt = 0

player_pos = pygame.Vector2(gg.screen.get_width() / 2, gg.screen.get_height() / 2)
# main game loop

myPiece = pygame.image.load('imgs/bp.png')
myPiece = pygame.transform.scale(myPiece, (80, 80))

move_piece = False
run = True
while run:
	mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			run = False
		if event.type == pygame.MOUSEBUTTONDOWN:
				gg.ColorTile = helpers.selectTile(gg.ColorTile, mouse_pos)


		if event.type == pygame.MOUSEBUTTONDOWN:
			if helpers.pointInRect(mouse_pos, pygame.Rect(player_pos.x, player_pos.y, 80, 80)):
				print("mouse down in square")
				move_piece = True
		elif event.type == pygame.MOUSEBUTTONUP:
			print("mouse up")
			move_piece = False
		if event.type == pygame.MOUSEMOTION and move_piece == True:
			print("mouse motion + mouse down true")
			player_pos.x = mouse_pos.x - 40
			player_pos.y = mouse_pos.y - 40

	gg.screen.fill(gg.Color2)

	helpers.drawBoard(gg.screen, gg.Color1, gg.ColorHighlight, WIDTH, HEIGHT, gg.ColorTile)
	gg.screen.blit(myPiece, pygame.Rect(player_pos.x, player_pos.y, 80, 80))
	pygame.display.flip()
	dt = clock.tick(60) / 1000

pygame.quit()