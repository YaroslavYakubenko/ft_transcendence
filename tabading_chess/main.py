
import pygame
import chess
import helpers
import classes
import movement

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

run = True
while run:

	mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			run = False
		# get tile that was clicked on + pieceInfo
		# if event.type == pygame.MOUSEBUTTONDOWN:
		# 		gg.ColorTile = helpers.selectTile(gg.ColorTile, mouse_pos)
		# 		helpers.getPieceInfo(gg, gg.ColorTile)
		# 		print(f'type {gg.pp.type}, prev pos {gg.pp.prevTile}')

		movement.move(gg, mouse_pos, player_pos, event)

	gg.screen.fill(gg.Color2)
	helpers.drawBoard(gg.screen, gg.Color1, gg.ColorHighlight, WIDTH, HEIGHT, gg.ColorTile)
	helpers.drawPieces(gg)
	# gg.screen.blit(gg.piece_img["K"], pygame.Rect(player_pos.x, player_pos.y, 100, 100))
	pygame.display.flip()
	dt = clock.tick(60) / 1000

pygame.quit()