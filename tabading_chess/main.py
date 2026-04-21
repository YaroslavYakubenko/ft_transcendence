
import pygame
import chess
import helpers
import classes
import movement


pygame.init()
game = classes.game(1100, 800, 100)
print(game.board)
clock = pygame.time.Clock()
dt = 0

running = True
playing = True
while running:

	# main game loop
	while playing:

		# get current mouse pos
		mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

		for event in pygame.event.get():
			if event.type == pygame.QUIT:
				playing = False
				running = False

			movement.move(game, event, mouse_pos)
		# draw the basic board
		game.screen.fill(game.colors.base)
		helpers.draw_board(game)
		helpers.draw_pieces(game)

		if game.board.is_game_over() == True:
			playing = False
			helpers.game_over(game)
		
		pygame.display.flip()
		dt = clock.tick(60) / 1000


	mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			running = False
		if event.type == pygame.MOUSEBUTTONDOWN:
			helpers.check_menu_click(game, game.gameover_menu, mouse_pos)


pygame.quit()


# Hello1295!