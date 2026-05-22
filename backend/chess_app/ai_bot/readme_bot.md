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

def evaluate_fen(fen: str) -> int:
    board = chess.Board(fen)

    if board.is_checkmate():
        return -99999 if board.turn == chess.WHITE else 99999

    if board.is_stalemate() or board.is_insufficient_material():
        return 0

    score = 0

    for piece_type, value in PIECE_VALUES.items():
        score += len(board.pieces(piece_type, chess.WHITE)) * value
        score -= len(board.pieces(piece_type, chess.BLACK)) * value

    return score