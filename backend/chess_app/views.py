from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
import chess
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Game, Move
from django.utils import timezone
from users.elo_utils import calculate_elo_change, calculate_draw_elo
from users.models import User
from .game_results import get_game_result, get_resignation_result


def broadcast_game_over(game_id, payload):
	if not game_id:
		return

	channel_layer = get_channel_layer()
	if channel_layer is None:
		return

	async_to_sync(channel_layer.group_send)(
		f"game_{game_id}",
		{
			"type": "game_over",
			"payload": payload,
		},
	)

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


def finalize_game(game, game_result):
	"""Update player stats and ELO after game completion."""
	white_player = game.white_player
	black_player = game.black_player
	
	winner = game_result.get("winner")
	if winner == "white":
		game.result = "white_win"
		white_player.wins += 1
		black_player.losses += 1
		elo_change_white, elo_change_black = calculate_elo_change(
			white_player.elo, black_player.elo
		)
		white_player.elo += elo_change_white
		black_player.elo += elo_change_black
	elif winner == "black":
		game.result = "black_win"
		black_player.wins += 1
		white_player.losses += 1
		elo_change_white, elo_change_black = calculate_elo_change(
			white_player.elo, black_player.elo
		)
		white_player.elo += elo_change_white
		black_player.elo += elo_change_black
	else:
		game.result = "draw"
		white_player.draws += 1
		black_player.draws += 1
		elo_change_white, elo_change_black = calculate_draw_elo(
			white_player.elo, black_player.elo
		)
		white_player.elo += elo_change_white
		black_player.elo += elo_change_black
	
	# Save all changes
	white_player.save()
	black_player.save()
	game.status = 'completed'
	game.ended_at = timezone.now()
	game.save()


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
		promotion_result = {
			"type": "move",
			"game_over": False,
			"fen": fen,
			"promotion": (_s + _t),
			"result": None,
		}
		return Response({
			**promotion_result,
		})

	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	game_result = get_game_result(board)
	
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
			
			if game_result is not None:
				# Game is over, update stats
				finalize_game(game, game_result)
				payload = {
					"type": "game_over",
					"game_over": True,
					"result": game_result,
					"fen": board.fen(),
				}
				broadcast_game_over(game.id, payload)
			elif game.status == 'pending':
				game.status = 'ongoing'
				game.started_at = timezone.now()
				game.save()
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist

	response_data = {
		"type": "game_over" if game_result is not None else "move",
		"game_over": game_result is not None,
		"fen": board.fen(),
		"promotion": '',
		"result": game_result,
	}
	return Response(response_data)

@api_view(['POST'])
def do_promotion(request):
	fen = request.data.get('fen')
	_move = request.data.get('move')
	from_square = request.data.get('from')
	to_square = request.data.get('to')
	key = request.data.get('key')
	game_id = request.data.get('game_id')  # Optional: save to database if provided

	if not fen or not key:
		return Response({"error": "missing data"}, status=400)

	if not from_square or not to_square:
		if _move and len(_move) >= 4:
			from_square = _move[:2]
			to_square = _move[2:4]
		else:
			return Response({"error": "missing move squares"}, status=400)

	board = chess.Board(fen)
	move = chess.Move.from_uci(from_square + to_square + key)
	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	game_result = get_game_result(board)
	
	# Save promotion move to database if game_id is provided
	if game_id:
		try:
			game = Game.objects.get(id=game_id)
			move_count = game.moves.count() + 1
			Move.objects.create(
				game=game,
				from_square=from_square,
				to_square=to_square,
				promotion_piece=key.upper(),
				fen_before=fen,
				fen_after=board.fen(),
				move_number=move_count
			)
			# Update game FEN and status
			game.current_fen = board.fen()
			
			if game_result is not None:
				# Game is over, update stats
				finalize_game(game, game_result)
				payload = {
					"type": "game_over",
					"game_over": True,
					"result": game_result,
					"fen": board.fen(),
				}
				broadcast_game_over(game.id, payload)
			game.save()
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist
	
	response_data = {
		"type": "game_over" if game_result is not None else "move",
		"game_over": game_result is not None,
		"fen": board.fen(),
		"promotion": '',
		"result": game_result,
	}
	return Response(response_data)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_game(request):
	"""Create a new game and return game ID for move/resign tracking."""
	opponent_type = request.data.get('opponent', 'bot')

	if opponent_type == 'bot':
		bot_user, _ = User.objects.get_or_create(
			email='chess-bot@transcendence.local',
			defaults={'username': 'ChessBot', 'is_active': True},
		)
		opponent = bot_user
	elif opponent_type == 'live':
		opponent_id = request.data.get('opponent_id')
		if not opponent_id:
			return Response({'error': 'opponent_id is required for live games'}, status=400)
		try:
			opponent = User.objects.get(id=opponent_id)
		except User.DoesNotExist:
			return Response({'error': 'Opponent not found'}, status=404)
		if opponent == request.user:
			return Response({'error': 'Cannot create a game against yourself'}, status=400)
	else:
		return Response({'error': 'Invalid opponent type'}, status=400)

	game = Game.objects.create(
		white_player=request.user,
		black_player=opponent,
		status='pending',
		result='ongoing',
	)

	return Response({
		'game_id': game.id,
		'status': game.status,
		'result': game.result,
	}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resign_game(request):
	"""Handle game resignation - resigner loses immediately"""
	game_id = request.data.get('game_id')

	if not game_id:
		return Response({"error": "game_id is required"}, status=400)

	try:
		game = Game.objects.get(id=game_id)
	except Game.DoesNotExist:
		return Response({"error": "Game not found"}, status=404)

	# Check if game is already completed
	if game.status == 'completed':
		return Response({"error": "Game is already completed"}, status=400)

	# Determine which player resigned
	if game.white_player == request.user:
		# White player resigned, black wins
		game.result = 'black_win'
		resigner = game.white_player
		winner = game.black_player
	elif game.black_player == request.user:
		# Black player resigned, white wins
		game.result = 'white_win'
		resigner = game.black_player
		winner = game.white_player
	else:
		return Response({"error": "You are not a player in this game"}, status=403)

	# Update player stats
	winner.wins += 1
	resigner.losses += 1

	# Update ELO
	elo_change_winner, elo_change_loser = calculate_elo_change(
		winner.elo, resigner.elo
	)
	winner.elo += elo_change_winner
	resigner.elo += elo_change_loser

	# Save player changes
	winner.save()
	resigner.save()

	# Mark game as completed
	game.status = 'completed'
	game.ended_at = timezone.now()
	game.save()

	game_result = get_resignation_result("black" if game.white_player == request.user else "white")
	payload = {
		"type": "game_over",
		"game_over": True,
		"result": game_result,
		"fen": game.current_fen,
	}
	broadcast_game_over(game.id, payload)

	return Response({
		"status": "success",
		"type": "game_over",
		"game_over": True,
		"result": game_result,
		"fen": game.current_fen,
	})