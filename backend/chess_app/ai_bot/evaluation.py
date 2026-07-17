# This module provides a simple evaluation function for chess positions based on material count.

import chess

PIECE_VALUES = {
	chess.PAWN: 100,
	chess.KNIGHT: 320,
	chess.BISHOP: 330,
	chess.ROOK: 500,
	chess.QUEEN: 900,
	chess.KING: 0,
}

KNIGHT_TABLE = [
	-50, -40, -30, -30, -30, -30, -40, -50,
	-40, -20,   0,   0,   0,   0, -20, -40,
	-30,   0,  10,  15,  15,  10,   0, -30,
	-30,   5,  15,  20,  20,  15,   5, -30,
	-30,   0,  15,  20,  20,  15,   0, -30,
	-30,   5,  10,  15,  15,  10,   5, -30,
	-40, -20,   0,   5,   5,   0, -20, -40,
	-50, -40, -30, -30, -30, -30, -40, -50,
]

PAWN_TABLE = [
     0,   0,   0,   0,   0,   0,   0,   0,
    10,  10,  10, -10, -10,  10,  10,  10,
     5,   5,   5,   5,   5,   5,   5,   5,
     0,   0,   0,  20,  20,   0,   0,   0,
     5,   5,  10,  25,  25,  10,   5,   5,
    10,  10,  10,  20,  20,  10,  10,  10,
    20,  20,  20,  30,  30,  20,  20,  20,
     0,   0,   0,   0,   0,   0,   0,   0,
]

BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
]

ROOK_TABLE = [
     0,  0,  5, 10, 10,  5,  0,  0,
     0,  0,  5, 10, 10,  5,  0,  0,
     0,  0,  5, 10, 10,  5,  0,  0,
     0,  0,  5, 10, 10,  5,  0,  0,
     0,  0,  5, 10, 10,  5,  0,  0,
     0,  0,  5, 10, 10,  5,  0,  0,
     10,10,10, 20, 20, 10, 10, 10,
     0,  0,  5, 10, 10,  5,  0,  0,
]

def evaluate_fen(fen: str) -> int:
	board = chess.Board(fen)

	if board.is_checkmate():
		return -99999 if board.turn == chess.WHITE else 99999

	if board.is_stalemate() or board.is_insufficient_material():
		return 0

	score = 0

# Evaluate material balance
	for piece_type, value in PIECE_VALUES.items():
		score += len(board.pieces(piece_type, chess.WHITE)) * value
		score -= len(board.pieces(piece_type, chess.BLACK)) * value

# Evaluate knight position
	for square in board.pieces(chess.KNIGHT, chess.WHITE):
		score += KNIGHT_TABLE[square]
	for square in board.pieces(chess.KNIGHT, chess.BLACK):
		score -= KNIGHT_TABLE[chess.square_mirror(square)]
	
# Evaluate pawn position
	for square in board.pieces(chess.PAWN, chess.WHITE):
		score += PAWN_TABLE[square]
	for square in board.pieces(chess.PAWN, chess.BLACK):
		score -= PAWN_TABLE[chess.square_mirror(square)]

# Evaluate bishop position
	for square in board.pieces(chess.BISHOP, chess.WHITE):
		score += BISHOP_TABLE[square]
	for square in board.pieces(chess.BISHOP, chess.BLACK):
		score -= BISHOP_TABLE[chess.square_mirror(square)]

# Evaluate rook position
	for square in board.pieces(chess.ROOK, chess.WHITE):
		score += ROOK_TABLE[square]
	for square in board.pieces(chess.ROOK, chess.BLACK):
		score -= ROOK_TABLE[chess.square_mirror(square)]

	return score