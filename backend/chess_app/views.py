from rest_framework.decorators import api_view
from rest_framework.response import Response
import chess

def check_gameover(board):

	if board.is_checkmate():
		result = "checkmate"
	elif board.is_stalemate():
		result = "stalemate"
	elif board.is_insufficient_material():
		result = "draw"
	else:
		result = "ongoing"
	return result


# Django API endpoint - wraps your logic
@api_view(['POST'])
def make_move(request):
	fen = request.data.get('fen')
	_s = request.data.get('from')
	_t = request.data.get('to')

	if not fen or not _s or not _t:
		return Response({"error": "missing data"}, status=400)

	board = chess.Board(fen)

	move = chess.Move.from_uci(_s + _t)
	print(move)

	if move not in board.legal_moves:
		return Response({"error": "illegal move"}, status=400)

	board.push(move)

	res = check_gameover(board)

	return Response({
		"fen": board.fen(),
		"result": res
		})