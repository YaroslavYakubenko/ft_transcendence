from __future__ import annotations

import chess


def _termination_label(termination: chess.Termination) -> str:
	labels = {
		"checkmate": "checkmate",
		"stalemate": "stalemate",
		"insufficient_material": "insufficient material",
		"threefold_repetition": "repetition",
		"fivefold_repetition": "repetition",
		"fifty_moves": "50-move rule",
		"seventyfive_moves": "75-move rule",
	}
	termination_name = termination.name.lower()
	return labels.get(termination_name, termination_name.replace("_", " "))


def _winner_label(winner: bool | None) -> str | None:
	if winner is None:
		return None
	return "white" if winner == chess.WHITE else "black"


def _pgn_result(winner: str | None) -> str:
	if winner == "white":
		return "1-0"
	if winner == "black":
		return "0-1"
	return "1/2-1/2"


def _build_result(winner: str | None, termination: str) -> dict[str, str | None]:
	if winner is None:
		message = f"Draw by {termination}"
	else:
		message = f"{winner.capitalize()} wins by {termination}"

	return {
		"winner": winner,
		"termination": termination,
		"message": message,
		"pgn_result": _pgn_result(winner),
	}


def get_game_result(board: chess.Board) -> dict[str, str | None] | None:
	"""Return a structured game result for a finished board position."""
	outcome = board.outcome(claim_draw=True)
	if outcome is None:
		return None

	winner = _winner_label(outcome.winner)
	termination = _termination_label(outcome.termination)
	return _build_result(winner, termination)


def get_resignation_result(winner: str) -> dict[str, str | None]:
	"""Return a structured result for a resignation outcome."""
	return _build_result(winner, "resignation")