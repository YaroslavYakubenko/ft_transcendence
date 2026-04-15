
import pygame

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

def drawPieces(board, selected):
	pass

# turns pix vector of mouse_pos into round down version 235 -> 200
# gives upper left corner esentially to draw
def selectTile(ColorTile, mouse_pos):
	x = int (mouse_pos.x / 100) * 100
	y = int (mouse_pos.y / 100) * 100
	print (x, y)
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