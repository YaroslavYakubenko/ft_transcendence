from rest_framework.decorators import api_view
from rest_framework.response import Response
import chess


@api_view(['POST'])
def new_game(request):
    board = chess.Board()
    return Response({'fen': board.fen()})


# Your logic from movement.py
def move_piece(start_sq_num, dest_sq_num, board):
    move = chess.Move(start_sq_num, dest_sq_num)
    if dest_sq_num in [m.to_square for m in board.legal_moves if m.from_square == start_sq_num]:
        board.push(move)
        return True
    return False

# Your logic from helpers.py
def get_piece_moves(board, square):
    return [move.to_square for move in board.legal_moves if move.from_square == square]

# Django API endpoint - wraps your logic
@api_view(['POST'])
def make_move(request):
    from_sq = request.data.get('from')      # 'e2'
    to_sq = request.data.get('to')          # 'e4'
    fen = request.data.get('fen')           # current board
    
    board = chess.Board(fen)
    start_num = chess.parse_square(from_sq)
    dest_num = chess.parse_square(to_sq)
    
    if move_piece(start_num, dest_num, board):
        return Response({
            'fen': board.fen(),
            'legal': True,
            'game_over': board.is_game_over()
        })
    return Response({'legal': False})
