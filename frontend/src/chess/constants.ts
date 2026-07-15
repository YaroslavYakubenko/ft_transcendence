


export const PROMOTION_PIECES = ["Q", "R", "B", "N"] as const

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

export const BOARD_SIZE = 500

export const SQUARE_SIZE = BOARD_SIZE / 8


export interface GameSettings {
	opponent: 'bot' | 'live'
	difficulty: 'easy' | 'medium' | 'hard'
	timer: 'none' | '3' | '5' | '10'
	pieceColor: 'white' | 'black' | 'random'
	userColor: 'white' | 'black'
	boardTheme: 'default' | 'green' | 'blue' | 'brown'
	pieceTheme: 'default' | 'simple'
	game_id?: number
	fen?: string
}

export const DEFAULT_SETTINGS: GameSettings = {
	opponent: 'bot',
	difficulty: 'medium',
	timer: 'none',
	pieceColor: 'random',
	userColor: 'white',
	boardTheme: 'default',
	pieceTheme: 'default',
	game_id: undefined,
	fen: undefined,
}

// diffrent keys each game so on repeat there shouldn't be anything repeated? ig
export const getStorageKeys = (gameId: number | null) => {
	const id = gameId ?? "local"

	return {
		fen: `chess_fen_${id}`,
		move_history: `move_history_${id}`,
		piece_color: `piece_color_${id}`,
		result: `result_${id}`,
	}
}

export const getAchStorageKeys = (_userId: number | null) => {
	return {
		played_games: `played_games_${_userId}`,
		ach_1 : `first_win_${_userId}`,
		ach_2 : `on_a_roll_${_userId}`,
		ach_3 : `veteran_${_userId}`,
		ach_4 : `grandmaster_${_userId}`,
		ach_5 : `untouchable_${_userId}`,
		win_counter: `win_counter${_userId}`,
		highest_win_streak: `highest_win_streak_${_userId}`,
	}
}
