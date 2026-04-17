
import pygame
import chess
import helpers
import classes
import movement


pygame.init()
game = classes.game(1000, 800, 100)
print(game.board)
clock = pygame.time.Clock()
dt = 0

# main game loop

run = True
while run:

	# get current mouse pos
	mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			run = False

		movement.move(game, event, mouse_pos)
	# draw the basic board
	game.screen.fill(game.colors.base)
	helpers.draw_board(game)
	helpers.draw_pieces(game)

	pygame.display.flip()
	dt = clock.tick(60) / 1000

pygame.quit()
