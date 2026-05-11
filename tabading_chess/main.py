import pygame
import chess
import helpers
import classes
import movement

pygame.init()

game = classes.game(1100, 800, 100)

clock = pygame.time.Clock()
running = True

# game states:
# "playing"
# "game_over"
game.state = "playing"

while running:

    mouse_pos = pygame.Vector2(pygame.mouse.get_pos())

    # -------------------------
    # EVENTS
    # -------------------------
    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False

        # -------------------------
        # PLAYING EVENTS
        # -------------------------
        if game.state == "playing":
            movement.move(game, event, mouse_pos)

        # -------------------------
        # GAME OVER EVENTS
        # -------------------------
        elif game.state == "game_over":

            if event.type == pygame.MOUSEBUTTONDOWN:
                helpers.check_menu_click(
                    game,
                    game.gameover_menu,
                    mouse_pos
                )

    # -------------------------
    # UPDATE GAME STATE
    # -------------------------
    if game.state == "playing":

        if game.board.is_game_over():

            helpers.game_over(game)

            game.state = "game_over"

    # -------------------------
    # RENDER
    # -------------------------
    game.screen.fill(game.colors.base)

    helpers.draw_board(game)

    helpers.draw_pieces(game)

    # draw game over menu on top
    if game.state == "game_over":
        helpers.draw_game_over_menu(game)

    pygame.display.flip()

    clock.tick(60)

pygame.quit()