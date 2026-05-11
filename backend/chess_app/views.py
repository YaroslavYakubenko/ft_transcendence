from rest_framework.decorators import api_view
from rest_framework.response import Response
import chess
from .models import Game, Move
from django.utils import timezone

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
	game_id = request.data.get('game_id')  # Optional: save to database if provided

	if not fen or not _s or not _t:
		return Response({"error": "missing data"}, status=400)
	
	if _s == _t:
		return Response({"log": "piece not moved"})

	board = chess.Board(fen)
	move = chess.Move.from_uci(_s + _t)
	if check_promotion(board, _s, _t) == True:
		return Response({
			"fen": fen,
			"result": "ongoing",
			"promotion": (_s + _t)
		})

	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	res = check_gameover(board)
	
	# Save move to database if game_id is provided
	if game_id:
		try:
			game = Game.objects.get(id=game_id)
			move_count = game.moves.count() + 1
			Move.objects.create(
				game=game,
				from_square=_s,
				to_square=_t,
				fen_before=fen,
				fen_after=board.fen(),
				move_number=move_count
			)
			# Update game FEN and status
			game.current_fen = board.fen()
			game.result = res
			if res != "ongoing":
				game.status = 'completed'
				game.ended_at = timezone.now()
			elif game.status == 'pending':
				game.status = 'ongoing'
				game.started_at = timezone.now()
			game.save()
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist

	return Response({
		"fen": board.fen(),
		"result": res,
		"promotion": ''
		})

@api_view(['POST'])
def do_promotion(request):
	fen = request.data.get('fen')
	_move = request.data.get('move')
	key = request.data.get('key')
	game_id = request.data.get('game_id')  # Optional: save to database if provided

	if not fen or not _move or not key:
		return Response({"error": "missing data"}, status=400)

	board = chess.Board(fen)
	move = chess.Move.from_uci(_move + key)
	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	res = check_gameover(board)
	
	# Save promotion move to database if game_id is provided
	if game_id:
		try:
			game = Game.objects.get(id=game_id)
			move_count = game.moves.count() + 1
			Move.objects.create(
				game=game,
				from_square=_move,
				to_square=key,
				promotion_piece=None,  # Could extract from move if needed
				fen_before=fen,
				fen_after=board.fen(),
				move_number=move_count
			)
			# Update game FEN and status
			game.current_fen = board.fen()
			game.result = res
			if res != "ongoing":
				game.status = 'completed'
				game.ended_at = timezone.now()
			game.save()
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist
	
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