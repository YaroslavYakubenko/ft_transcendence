from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import chess
from .models import Game, Move
from django.db.models import Q
from django.utils import timezone
from .game_results import get_resignation_result
from users.models import User
from chess_app.ai_bot.minimax import find_best_move, get_depth


def _apply_elo_change(rating: int, score: float, opponent_rating: int) -> int:
	expected = 1 / (1 + 10 ** ((opponent_rating - rating) / 400))
	return max(0, round(rating + 32 * (score - expected)))


def _get_bot_user() -> User:
	bot_user, created = User.objects.get_or_create(
		email='chess-bot@transcendence.local',
		defaults={
			'username': 'Chess Bot',
			'is_active': False,
			'is_online': False,
		},
	)
	if created:
		bot_user.set_unusable_password()
		bot_user.save(update_fields=['password'])
	elif not bot_user.username:
		bot_user.username = 'Chess Bot'
		bot_user.save(update_fields=['username'])
	return bot_user

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_game(request):
	opponent = request.data.get('opponent')
	difficulty = request.data.get('difficulty', 'medium')
	if opponent not in ('bot', 'live'):
		return Response({'error': 'unsupported opponent'}, status=status.HTTP_400_BAD_REQUEST)
	if difficulty not in ('easy', 'medium', 'hard'):
		return Response({'error': 'unsupported difficulty'}, status=status.HTTP_400_BAD_REQUEST)

	if opponent == 'bot':
		black_player = _get_bot_user()
	else:
		opponent_id = request.data.get('opponent_id')
		if not opponent_id:
			return Response({'error': 'missing opponent_id'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			black_player = User.objects.get(id=opponent_id)
		except User.DoesNotExist:
			return Response({'error': 'opponent not found'}, status=status.HTTP_404_NOT_FOUND)
		if black_player == request.user:
			return Response({'error': 'cannot play yourself'}, status=status.HTTP_400_BAD_REQUEST)

	game = Game.objects.create(
		white_player=request.user,
		black_player=black_player,
		difficulty=difficulty if opponent == 'bot' else 'medium',
		status='pending',
		result='ongoing',
	)
	return Response({'game_id': game.id}, status=status.HTTP_201_CREATED)


# Django API endpoint - wraps your logic
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resign_game(request):
	game_id = request.data.get('game_id')

	if not game_id:
		return Response({'error': 'missing data'}, status=status.HTTP_400_BAD_REQUEST)

	try:
		game = Game.objects.select_related('white_player', 'black_player').get(id=game_id)
	except Game.DoesNotExist:
		return Response({'error': 'game not found'}, status=status.HTTP_404_NOT_FOUND)

	if game.status == 'completed':
		return Response({'error': 'game already completed'}, status=status.HTTP_400_BAD_REQUEST)

	if request.user not in (game.white_player, game.black_player):
		return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

	resigning_player_is_white = request.user == game.white_player
	winner = 'black' if resigning_player_is_white else 'white'
	result_field = 'black_win' if resigning_player_is_white else 'white_win'
	result = get_resignation_result(winner)

	white_player = game.white_player
	black_player = game.black_player
	white_score = 0.0 if winner == 'black' else 1.0
	black_score = 0.0 if winner == 'white' else 1.0
	white_new_elo = _apply_elo_change(white_player.elo, white_score, black_player.elo)
	black_new_elo = _apply_elo_change(black_player.elo, black_score, white_player.elo)

	white_player.wins += 1 if winner == 'white' else 0
	white_player.losses += 1 if winner == 'black' else 0
	white_player.elo = white_new_elo
	white_player.save(update_fields=['wins', 'losses', 'elo'])

	black_player.wins += 1 if winner == 'black' else 0
	black_player.losses += 1 if winner == 'white' else 0
	black_player.elo = black_new_elo
	black_player.save(update_fields=['wins', 'losses', 'elo'])

	game.status = 'completed'
	game.result = result_field
	game.ended_at = timezone.now()
	game.save(update_fields=['status', 'result', 'ended_at'])

	return Response({
		'game_over': True,
		'result': result,
	})


@api_view(['POST'])
def make_move(request):
	fen = request.data.get('fen')
	_s = request.data.get('from')
	_t = request.data.get('to')
	game_id = request.data.get('game_id')  # Optional: save to database if provided
	bot_move_uci = ''

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
	
	# Try to find the game to persist the move and bot reply.
	game = None
	if game_id:
		try:
			game = Game.objects.select_related('white_player', 'black_player').get(id=game_id)
		except Game.DoesNotExist:
			game = None
	# If no explicit game_id, attempt to locate a game for the authenticated user matching the fen
	if not game and hasattr(request, 'user') and request.user and request.user.is_authenticated:
		try:
			game = Game.objects.select_related('white_player', 'black_player').filter(
				current_fen=fen,
				status__in=['pending', 'ongoing']
			).filter(
				Q(white_player=request.user) | Q(black_player=request.user)
			).first()
		except Exception:
			game = None

	if game:
		move_count = game.moves.count() + 1
		Move.objects.create(
			game=game,
			from_square=_s,
			to_square=_t,
			fen_before=fen,
			fen_after=board.fen(),
			move_number=move_count,
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

		# If opponent is the chess bot and it's the bot's turn, compute and apply bot move
		try:
			bot_user = _get_bot_user()
		except Exception:
			bot_user = None

		if bot_user and (game.black_player == bot_user or game.white_player == bot_user):
			is_bot_white = (game.white_player == bot_user)
			if (board.turn == chess.WHITE and is_bot_white) or (board.turn == chess.BLACK and not is_bot_white):
				difficulty = game.difficulty or 'medium'
				depth = get_depth(difficulty)
				bot_move = find_best_move(board, depth, difficulty)
				if bot_move is not None:
					fen_before_bot = board.fen()
					bot_move_uci = chess.square_name(bot_move.from_square) + chess.square_name(bot_move.to_square)
					board.push(bot_move)
					res_after = check_gameover(board)
					move_count = game.moves.count() + 1
					Move.objects.create(
						game=game,
						from_square=chess.square_name(bot_move.from_square),
						to_square=chess.square_name(bot_move.to_square),
						fen_before=fen_before_bot,
						fen_after=board.fen(),
						move_number=move_count,
					)
					# Update game state
					game.current_fen = board.fen()
					game.result = res_after
					if res_after != 'ongoing':
						game.status = 'completed'
						game.ended_at = timezone.now()
					game.save()

	return Response({
		"fen": board.fen(),
		"result": check_gameover(board),
		"promotion": '',
		"bot_move": bot_move_uci,
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