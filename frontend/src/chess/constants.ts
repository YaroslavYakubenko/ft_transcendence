


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