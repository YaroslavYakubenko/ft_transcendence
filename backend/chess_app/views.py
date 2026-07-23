from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
import chess
import random
from .models import Game, Move
from django.utils import timezone
from users.elo_utils import calculate_elo_change, calculate_draw_elo
from users.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def check_gameover(board):

	if board.is_checkmate():
		result = "checkmate"
	elif board.is_check():
		result = "check"
	elif board.is_stalemate():
		result = "stalemate"
	elif board.is_insufficient_material():
		result = "draw"
	else:
		result = "ongoing"
	return result


BOT_EMAIL = 'chess-bot@transcendence.local'


def _get_bot_player(game):
	if game.white_player and game.white_player.email == BOT_EMAIL:
		return game.white_player
	if game.black_player and game.black_player.email == BOT_EMAIL:
		return game.black_player
	return None


def _play_bot_move(game):
	bot_player = _get_bot_player(game)
	if not bot_player:
		return {
			'fen': game.current_fen,
			'bot_move': '',
			'result': 'ongoing',
			'winner': '',
			'kingpos': '',
		}

	board = chess.Board(game.current_fen)
	bot_is_white = bot_player == game.white_player
	if board.turn != bot_is_white:
		return {
			'fen': game.current_fen,
			'bot_move': '',
			'result': 'ongoing',
			'winner': '',
			'kingpos': '',
		}

	try:
		from chess_app.ai_bot.minimax import find_best_move, get_depth
		# difficulty = getattr(game, 'difficulty', 'medium')
		difficulty = game.difficulty
		depth = get_depth(difficulty)
		best = find_best_move(board, depth, difficulty)
		if not best:
			return {
				'fen': game.current_fen,
				'bot_move': '',
				'result': 'ongoing',
				'winner': '',
				'kingpos': '',
			}

		board.push(best)
		move_count = game.moves.count() + 1
		promo = None
		if best.promotion:
			try:
				promo = chess.piece_symbol(best.promotion).upper()
			except Exception:
				promo = None

		Move.objects.create(
			game=game,
			from_square=chess.square_name(best.from_square),
			to_square=chess.square_name(best.to_square),
			promotion_piece=promo,
			fen_before=game.current_fen,
			fen_after=board.fen(),
			move_number=move_count,
		)

		game.current_fen = board.fen()
		bot_result = check_gameover(board)
		bot_winner = ''
		bot_king = ''
		if bot_result == 'check':
			bot_king = chess.square_name(board.king(board.turn))
			bot_result = 'ongoing'
		elif bot_result != 'ongoing':
			bot_winner = 'Black' if board.turn == chess.WHITE else 'White'
			update_player_stats(game, bot_result)
		else:
			game.save(update_fields=['current_fen'])

		return {
			'fen': board.fen(),
			'bot_move': best.uci(),
			'result': bot_result,
			'winner': bot_winner,
			'kingpos': bot_king,
		}
	except Exception:
		return {
			'fen': game.current_fen,
			'bot_move': '',
			'result': 'ongoing',
			'winner': '',
			'kingpos': '',
		}

def check_promotion(board, _s, _t):

	piece = board.piece_at(chess.parse_square(_s))

	if piece is None:
		return False
	# not your turn
	if piece and piece.color != board.turn:
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


def update_player_stats(game, result):
	"""Update player stats and ELO after game completion"""
	white_player = game.white_player
	black_player = game.black_player
	
	if result == "checkmate":
		# Determine winner from FEN/board state
		board = chess.Board(game.current_fen)
		# In checkmate, the player who just moved won, but we need to check whose turn it is
		# If it's white's turn after black's move, black won
		if board.turn == chess.WHITE:
			# Black won
			game.result = "black_win"
			black_player.wins += 1
			white_player.losses += 1
			# Update ELO
			elo_change_white, elo_change_black = calculate_elo_change(
				white_player.elo, black_player.elo
			)
			white_player.elo += elo_change_white
			black_player.elo += elo_change_black
		else:
			# White won
			game.result = "white_win"
			white_player.wins += 1
			black_player.losses += 1
			# Update ELO
			elo_change_white, elo_change_black = calculate_elo_change(
				white_player.elo, black_player.elo
			)
			white_player.elo += elo_change_white
			black_player.elo += elo_change_black
	elif result == "stalemate" or result == "draw":
		game.result = "draw"
		white_player.draws += 1
		black_player.draws += 1
		# Update ELO for draw
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
@permission_classes([IsAuthenticated])
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
			"winner": "",
			"promotion": (_s + _t)
		})

	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	res = check_gameover(board)
	win = ""
	king = ""
	bot_move_uci = ''
	response_fen = board.fen()
	if res == "check":
		king = chess.square_name(board.king(board.turn))
		res = "ongoing"
	elif res != "ongoing" and res != "draw":
		win = "Black" if board.turn else "White"

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
			if game.status == 'pending':
				game.status = 'ongoing'
				game.started_at = timezone.now()
			game.save()
			if res != "ongoing":
				# Game is over, update stats
				update_player_stats(game, res)
			else:
				bot_state = _play_bot_move(game)
				if bot_state['bot_move']:
					bot_move_uci = bot_state['bot_move']
					response_fen = bot_state['fen']
					res = bot_state['result']
					win = bot_state['winner']
					king = bot_state['kingpos']
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist

	return Response({
		"fen": response_fen,
		"result": res,
		"winner" : win,
		"promotion": '',
		"kingpos" : king,
		"bot_move": bot_move_uci,
		})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def do_promotion(request):
	fen = request.data.get('fen')
	_move = request.data.get('move')
	promo_to = request.data.get('key')
	game_id = request.data.get('game_id')  # Optional: save to database if provided

	if not fen or not _move or not promo_to:
		return Response({"error": "missing data"}, status=400)

	board = chess.Board(fen)
	move = chess.Move.from_uci(_move + promo_to)
	if move not in board.legal_moves:
		return Response({"log": "illegal move"})

	board.push(move)
	res = check_gameover(board)
	win = ""
	if res != "ongoing":
		win = "Black" if board.turn else "White"
	
	# Save promotion move to database if game_id is provided
	if game_id:
		try:
			game = Game.objects.get(id=game_id)
			move_count = game.moves.count() + 1
			Move.objects.create(
				game=game,
				from_square=_move,
				to_square=promo_to,
				promotion_piece=None,  # Could extract from move if needed
				fen_before=fen,
				fen_after=board.fen(),
				move_number=move_count
			)
			# Update game FEN and status
			game.current_fen = board.fen()	
			if res != "ongoing":
				# Game is over, update stats
				update_player_stats(game, res)
			game.save()
		except Game.DoesNotExist:
			pass  # Continue without saving if game doesn't exist
	
	return Response({
		"fen": board.fen(),
		"result": res,
		"winner" : win,
		"promotion": ''
		})


# return legal moves to free & occupied spaces
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

	return Response({
		"moves": moves,
		"moves2": moves2,
		})


# when resigning always assumes player 1 is white -> doesn't check pieceColor
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_game(request):
	"""Create a new game and return game ID for move/resign tracking."""
	opponent_type = request.data.get('opponent', 'bot')
	piece_color = request.data.get('pieceColor', 'random')
	difficulty = request.data.get('difficulty', 'medium')
	if difficulty not in ('easy', 'medium', 'hard'):
		difficulty = 'medium'
	timer = request.data.get('timer', 'none')

	if opponent_type == 'bot':
		bot_user, _ = User.objects.get_or_create(
			email=BOT_EMAIL,
			defaults={
				'username': 'Chess Bot',
				'is_active': True,
				'is_online': True,
				'oauth_avatar': '/imgs/bk.png',
			},
		)
		if not bot_user.is_online:
			bot_user.is_online = True
		if not bot_user.username:
			bot_user.username = 'Chess Bot'
		if not bot_user.oauth_avatar:
			bot_user.oauth_avatar = '/imgs/bk.png'
		bot_user.set_unusable_password()
		bot_user.save()
		opponent = bot_user

	elif opponent_type == 'live':
		opponent_id = request.data.get('opponent_id')

		if opponent_id:
			try:
				opponent = User.objects.get(id=opponent_id)
			except User.DoesNotExist:
				return Response({'error': 'Opponent not found'}, status=404)
		
		#no opponent yet
		else:
			opponent = None
	else:
		return Response({'error': 'Invalid opponent type'}, status=400)

	if piece_color == 'random':
		piece_color = random.choice(['white', 'black'])

	if piece_color == 'white':
		white_player = request.user
		black_player = opponent
	else:
		white_player = opponent
		black_player = request.user

	game = Game.objects.create(
		white_player=white_player,
		black_player=black_player,
		status='pending',
		result='ongoing',
		timer=timer,
		difficulty=difficulty,
	)

	if (game.white_player and game.white_player.email == BOT_EMAIL) or (game.black_player and game.black_player.email == BOT_EMAIL):
		game.status = 'ongoing'
		game.started_at = timezone.now()
		game.save()

		bot_state = _play_bot_move(game)
		if bot_state['bot_move']:
			game.refresh_from_db()

	if piece_color == 'white':
		return Response({
			'game_id': game.id,
			'user': 'white',
			'opp': 'black',
			'status': game.status,
			'result': game.result,
			'current_fen': game.current_fen,
			'bot_move': bot_state['bot_move'] if 'bot_state' in locals() else '',
		}, status=201)

	return Response({
		'game_id': game.id,
		'user': 'black',
		'opp': 'white',
		'status': game.status,
		'result': game.result,
		'current_fen': game.current_fen,
		'bot_move': bot_state['bot_move'] if 'bot_state' in locals() else '',
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
		winner_label = 'Black'
		resigner = game.white_player
		winner = game.black_player
	elif game.black_player == request.user:
		# Black player resigned, white wins
		game.result = 'white_win'
		winner_label = 'White'
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

	# Notify both players via WebSocket
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		f'game_{game_id}',
		{
			'type': 'game_message',
			'msg_type': 'resign',
			'resigned_player': resigner.username or resigner.email,
			'result': 'resign',
			'winner': winner_label,
			'fen': game.current_fen,
		}
	)

	return Response({
		"status": "success",
		"result": game.result,
		"message": f"{resigner.username or resigner.email} resigned. {winner.username or winner.email} wins!"
	})


def update_achievements_db(user, winner, color):

	if color == winner:
		user.win_counter += 1
		if (user.highest_win_streak < user.win_counter):
			user.highest_win_streak = user.win_counter
	else:
		user.win_counter = 0
	user.save()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_color(request):
	game_id = request.data.get('gameId')
	result = request.data.get('result')
	
	if not game_id:
		return Response({"error": "game_id is required"}, status=400)

	try:
		game = Game.objects.get(id=game_id)
	except Game.DoesNotExist:
		return Response({"error": "Game not found"}, status=404)

	color = "Black"
	if game.white_player == request.user:
		color = "White"

	update_achievements_db(request.user, result, color)

	return Response({
		"status": "valid",
	})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_game_status(request):
	game_id = request.data.get('gameId')
	
	print("here")
	if not game_id:
		return Response({"error": "game_id is required"}, status=400)

	try:
		game = Game.objects.get(id=game_id)
	except Game.DoesNotExist:
		return Response({"error": "Game not found"}, status=404)

	if game.status == 'completed':
		return Response({"error": "Game is already completed"}, status=400)

	if (game.white_player == request.user or game.black_player == request.user):
		return Response({"error": "same"}, status=403)

	if (game.white_player is not None and game.black_player is not None
			and game.white_player != request.user and game.black_player != request.user):
		return Response({"error": "You are not a player in this game"}, status=403)

	return Response({
		"status": "valid",
	})
