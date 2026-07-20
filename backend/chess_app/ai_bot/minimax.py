# This module implements the minimax algorithm for the chess AI bot. 
# #It recursively evaluates the game tree to determine the best move for the maximizing player (the AI) 
# #while assuming that the opponent (the minimizing player) also plays optimally.

import chess
from chess_app.ai_bot.evaluation import evaluate_fen
import random


def minimax_alpha_beta(board: chess.Board, depth: int, alpha: float, beta: float, maximizing: bool):
    if depth == 0 or board.is_game_over():
        return evaluate_fen(board.fen())

    if maximizing:
        best = -float('inf')

        for move in order_moves(board):
            board.push(move)
            score = minimax_alpha_beta(board, depth - 1, alpha, beta, False)
            board.pop()
            best = max(best, score)
            alpha = max(alpha, best)

            #pruning: if the opponent has a better option, we can stop evaluating this branch
            if beta <= alpha:
                break

        return best
    
    else:
        best = float('inf')
        for move in order_moves(board):
            board.push(move)
            score = minimax_alpha_beta(board, depth - 1, alpha, beta, True)
            board.pop()
            best = min(best, score)
            beta = min(beta, best)

            #pruning
            if beta <= alpha:
                break

        return best

def find_best_move(board: chess.Board, depth: int, difficulty: str):
    # If the game is already over, there's no move to pick
    if board.is_game_over():
        return None

    # AI is the side to move on the provided board
    ai_color = board.turn

    moves_scores = []

    for move in order_moves(board):
        board.push(move)
        try:
            score = minimax_alpha_beta(
                board,
                depth - 1,
                -float('inf'),
                float('inf'),
                False,
            )
        finally:
            board.pop()

        # normalize score so that higher is always better for the AI side
        norm_score = score if ai_color == chess.WHITE else -score
        moves_scores.append((move, norm_score))

    if not moves_scores:
        return None

    moves_scores.sort(key=lambda x: x[1], reverse=True)

    best_move = moves_scores[0]
    top2 = moves_scores[:2] if len(moves_scores) >= 2 else moves_scores
    top3 = moves_scores[:3] if len(moves_scores) >= 3 else moves_scores

    if difficulty == 'easy':
        if top3 and random.random() < 0.4:  # 40% chance to pick a random move from the top 3
            return random.choice(top3)[0]
        return best_move[0]

    if difficulty == 'medium':
        if top2 and random.random() < 0.2:  # 20% chance to pick a random move from the top 2
            return random.choice(top2)[0]
        return best_move[0]

    if difficulty == 'hard':
        if top2 and random.random() < 0.05:  # 5% chance to pick a random move from the top 2
            return random.choice(top2)[0]
        return best_move[0]

    return best_move[0]
    
def order_moves(board: chess.Board):
    def score_move(move):
        score = 0

        # capture and check is prioritized
        if board.is_capture(move) or board.gives_check(move):
            score += 1000
        
        # promotion
        if move.promotion:
            score += 900
        
        # central moves slightly prioritized
        to_square = move.to_square

        center_squares = [chess.D4, chess.E4, chess.D5, chess.E5]   
        if move.to_square in center_squares:
            score += 50
        return score
    
    return sorted(board.legal_moves, key=score_move, reverse=True)

def get_depth(difficulty: str):
    return{
        'easy': 1,
        'medium': 2,
        'hard': 3
    }.get(difficulty, 2)  # Default to medium difficulty if invalid