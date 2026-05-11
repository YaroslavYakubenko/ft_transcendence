from __future__ import annotations

import random

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Match, User

BOT_EMAIL = 'chess-bot@local'
BOT_USERNAME = 'Chess Bot'
ELO_K_FACTOR = 32


def ensure_bot_user() -> User:
	bot_user, created = User.objects.get_or_create(
		email=BOT_EMAIL,
		defaults={
			'username': BOT_USERNAME,
			'is_active': False,
			'is_online': False,
		},
	)
	if created:
		bot_user.set_unusable_password()
		bot_user.save(update_fields=['password'])
	elif not bot_user.username:
		bot_user.username = BOT_USERNAME
		bot_user.save(update_fields=['username'])
	return bot_user


def _resolve_color(piece_color: str) -> str:
	if piece_color in (Match.WHITE, Match.BLACK):
		return piece_color
	return random.choice([Match.WHITE, Match.BLACK])


def start_match(player: User, piece_color: str = 'random', opponent_user: User | None = None) -> Match:
	opponent = opponent_user or ensure_bot_user()
	color = _resolve_color(piece_color)
	white_player = player if color == Match.WHITE else opponent
	black_player = opponent if color == Match.WHITE else player
	return Match.objects.create(
		white_player=white_player,
		black_player=black_player,
		status=Match.ONGOING,
		started_at=timezone.now(),
	)


def _elo_expected(rating: int, opponent_rating: int) -> float:
	return 1.0 / (1.0 + 10 ** ((opponent_rating - rating) / 400))


def _apply_stats(user: User, score: float, opponent_rating: int) -> None:
	expected = _elo_expected(user.rating, opponent_rating)
	user.rating = max(0, round(user.rating + ELO_K_FACTOR * (score - expected)))
	if score == 1:
		user.wins += 1
	elif score == 0:
		user.losses += 1
	else:
		user.draws += 1
	user.save(update_fields=['wins', 'losses', 'draws', 'rating'])


def _result_scores(result: str) -> tuple[float, float]:
	if result == Match.WHITE:
		return 1.0, 0.0
	if result == Match.BLACK:
		return 0.0, 1.0
	return 0.5, 0.5


@transaction.atomic
def touch_match(match: Match, *, pgn_notation: str | None = None, final_fen: str | None = None) -> Match:
	locked_match = Match.objects.select_for_update().get(pk=match.pk)
	if locked_match.status == Match.COMPLETED:
		return locked_match
	if locked_match.started_at is None:
		locked_match.started_at = timezone.now()
	if pgn_notation is not None:
		locked_match.pgn_notation = pgn_notation
	if final_fen is not None:
		locked_match.final_fen = final_fen
	locked_match.save(update_fields=['started_at', 'pgn_notation', 'final_fen'])
	return locked_match


@transaction.atomic
def finalize_match(match: Match, result: str, *, pgn_notation: str | None = None, final_fen: str | None = None) -> Match:
	locked_match = Match.objects.select_for_update().select_related('white_player', 'black_player').get(pk=match.pk)
	if locked_match.status == Match.COMPLETED:
		return locked_match
	if locked_match.started_at is None:
		locked_match.started_at = timezone.now()
	if pgn_notation is not None:
		locked_match.pgn_notation = pgn_notation
	if final_fen is not None:
		locked_match.final_fen = final_fen
	locked_match.status = Match.COMPLETED
	locked_match.result = result
	locked_match.completed_at = timezone.now()
	locked_match.save()

	white_score, black_score = _result_scores(result)
	white_rating = locked_match.white_player.rating
	black_rating = locked_match.black_player.rating
	_apply_stats(locked_match.white_player, white_score, black_rating)
	_apply_stats(locked_match.black_player, black_score, white_rating)
	return locked_match


def get_ranking_queryset():
	return User.objects.exclude(email=BOT_EMAIL).order_by('-rating', '-wins', 'username', 'id')


def get_user_rank(user: User) -> int:
	user_ids = list(get_ranking_queryset().values_list('id', flat=True))
	try:
		return user_ids.index(user.id) + 1
	except ValueError:
		return len(user_ids) + 1


def get_user_stats(user: User) -> dict[str, int]:
	return {
		'wins': user.wins,
		'losses': user.losses,
		'rank': get_user_rank(user),
		'elo': user.rating,
	}


def build_leaderboard() -> list[dict[str, int | str]]:
	rows: list[dict[str, int | str]] = []
	for index, user in enumerate(get_ranking_queryset(), start=1):
		rows.append({
			'id': user.id,
			'username': user.username or user.email,
			'wins': user.wins,
			'losses': user.losses,
			'elo': user.rating,
			'rank': index,
		})
	return rows


def get_match_history_queryset(user: User, target_user: User | None = None):
	player = target_user or user
	return (
		Match.objects
		.filter(Q(white_player=player) | Q(black_player=player), status=Match.COMPLETED)
		.select_related('white_player', 'black_player')
		.order_by('-completed_at', '-created_at')
	)