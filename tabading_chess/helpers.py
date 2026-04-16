
import pygame
import chess

def pointInRect(point,rect):
    x1, y1, w, h = rect
    x2, y2 = x1+w, y1+h
    x, y = point
    if (x1 < x and x < x2):
        if (y1 < y and y < y2):
            return True
    return False

def drawBoard(screen, Color1, ColorHighlight, WIDTH, HEIGHT, ColorTile):
	x = 0
	y = 0
	for h in range(8):
		for i in range(8):
			if x == ColorTile.x and y == ColorTile.y:
				pygame.draw.rect(screen, ColorHighlight, pygame.Rect(x, y, (WIDTH - 200) / 8, HEIGHT / 8))
			elif h % 2 != 0 and i % 2 != 0:
				pygame.draw.rect(screen, Color1, pygame.Rect(x, y, (WIDTH - 200) / 8, HEIGHT / 8))
			elif h % 2 == 0 and i % 2 == 0:
				pygame.draw.rect(screen, Color1, pygame.Rect(x, y, (WIDTH - 200) / 8, HEIGHT / 8))
			x += 100
		pygame.draw.rect(screen, "gray22", pygame.Rect(800, y, 200, HEIGHT / 8))
		y += 100
		x = 0

def drawPieces(gg):
	x = 0
	y = 700
	for h in range(8):
		for i in range(8):
			square = int(chess.square(i, h))
			typ = gg.board.piece_at(square)
			if typ == None:
				x += 100
				continue
			if gg.dragNdrop == True and gg.pp.prevTile.x == x and gg.pp.prevTile.y == y:
				x += 100
				continue
			gg.screen.blit(gg.piece_img[typ.symbol()], pygame.Rect(x, y, 100, 100))
			x += 100
		y -= 100
		x = 0

# turns pix vector of mouse_pos into round down version 235 -> 200
# gives upper left corner esentially to draw
def selectTile(ColorTile, mouse_pos):
	x = int (mouse_pos.x / 100) * 100
	y = int (mouse_pos.y / 100) * 100
	# print (x, y)
	if x == ColorTile.x and y == ColorTile.y:
		return pygame.Vector2(-1, -1)
	return pygame.Vector2(x, y)

def snapIntoPlace(mouse_pos):
	tile = selectTile(pygame.Vector2(-1, -1), mouse_pos)
	return tile

# return grid ex. (0, 0) (0 ,1) etc. that coordanites ex. (289, 689) are in
def pixelToTile(vec_pos):
	tile = pygame.Vector2(int (vec_pos.x / 100), int (vec_pos.y / 100))
	return tile

def givImg(path, size):
	piece = pygame.image.load(path)
	piece = pygame.transform.scale(piece, (size, size))
	return piece

def pieceInBounds(player_pos):
	if player_pos.x < 0 or player_pos.x > 800:
		return False
	if player_pos.y < 0 or player_pos.y > 800:
		return False
	return True

# use selected tile to figure out which piece is standing there
# on the game board
def getPieceInfo(gg, Tile):
	t = pixelToTile(Tile)
	square = int(chess.square(t.x, t.y))
	gg.pp.type = gg.board.piece_at(square)
	gg.pp.prevTile.update(Tile)

