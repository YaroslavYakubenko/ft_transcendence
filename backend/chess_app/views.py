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

def check_promotion(board, _s, _t):

	piece = board.piece_at(chess.parse_square(_s))

	if piece is None:
		return False

	if piece.piece_type != chess.PAWN:
		return False

	to_rank = chess.parse_square(_t) // 8  # 0–7

	# white pawn reaching rank 7 (8th rank)
	if piece.color == chess.WHITE and to_rank == 7:
		return True

	# black pawn reaching rank 0 (1st rank)
	if piece.color == chess.BLACK and to_rank == 0:
		return True

	return False


# Django API endpoint - wraps your logic
@api_view(['POST'])
def make_move(request):
	fen = request.data.get('fen')
	_s = request.data.get('from')
	_t = request.data.get('to')

	if not fen or not _s or not _t:
		return Response({"error": "missing data"}, status=400)
	
	if _s == _t:
		return Response({"log": "piece not moved"})

	board = chess.Board(fen)
	move = chess.Move.from_uci(_s + _t)
	if check_promotion(board, _s, _t) == True:
		print('here')
		return Response({
			"fen": fen,
			"result": "ongoing",
			"promotion": (_s + _t)
		})

	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	res = check_gameover(board)

	return Response({
		"fen": board.fen(),
		"result": res,
		"promotion": ''
		})

@api_view(['POST'])
def do_promotion(request):
	print("here")

	fen = request.data.get('fen')
	_move = request.data.get('move')
	key = request.data.get('key')

	print("here")


	if not fen or not _move or not key:
		return Response({"error": "missing data"}, status=400)

	board = chess.Board(fen)
	move = chess.Move.from_uci(_move + key)
	print(move)
	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	print(board)
	res = check_gameover(board)
	return Response({
		"fen": board.fen(),
		"result": res,
		"promotion": ''
		})


@api_view(['POST'])
def legal_moves(request):
	fen = request.data.get("fen")

	if not fen:
		return Response({"error": "missing fen"}, status=400)

	board = chess.Board(fen)
	moves = {}
	moves2 = {}

	for m in board.legal_moves:
		frm = chess.square_name(m.from_square)
		to = chess.square_name(m.to_square)
		if board.piece_at(m.to_square):
			moves2.setdefault(frm, []).append(to)
		else:
			moves.setdefault(frm, []).append(to)

	# print(moves['h2'])
	return Response({
		"moves": moves,
		"moves2": moves2,
		})

# return 2, 1 not occupied, 1 occupied 