import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Chessboard } from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import type { PieceHandlerArgs, PieceDropHandlerArgs } from "react-chessboard"
import { make_move, legal_moves, resign_game, do_promotion, createGame } from "../api/game"
import { START_FEN } from "../chess/constants"
import { PIECE_THEMES, BOARD_THEMES, createSquareStyles } from "../chess/themes"
import { usePersistState, useRematchReset, usePlayerColor } from "../chess/hooks"
import { appendMove, getBoardCoordinates } from "../chess/utils"
import PromotionSelector from "../components/PromotionSelector"

interface GameResult {
	state: string
	winner: string
}

interface GameSettings {
	opponent: 'bot' | 'live'
	difficulty: 'easy' | 'medium' | 'hard'
	timer: 'none' | '3' | '5' | '10'
	pieceColor: 'white' | 'black' | 'random'
	boardTheme: 'default' | 'green' | 'blue' | 'brown'
	pieceTheme: 'default' | 'simple'
	game_id?: number
	rematchId?: number
}

function GamePage() {
	const { user, token } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()

	const settings: GameSettings = location.state ?? {
		opponent: 'bot',
		difficulty: 'medium',
		timer: 'none',
		pieceColor: 'random',
		boardTheme: 'default',
		pieceTheme: 'default',
	}

	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]
	const locationState = (location.state as Record<string, unknown>) ?? {}
	const gameIdFromState =
		locationState.game_id ??
		locationState.gameId ??
		((locationState.game as { id?: number } | undefined)?.id ?? null)
	const gameId = typeof gameIdFromState === 'number' ? gameIdFromState : null

	const storageKeys = useMemo(() => ({
		fen: `chess_fen_${gameId ?? 'local'}`,
		moveHistory: `move_history_${gameId ?? 'local'}`,
		pieceColor: `piece_color_${gameId ?? 'local'}`,
	}), [gameId])

	const [fen, setFen] = useState(() => {
		if (location.state?.rematchId) return START_FEN
		return localStorage.getItem(storageKeys.fen) || START_FEN
	})
	const [result, setRes] = useState<GameResult>({ state: 'ongoing', winner: '' })
	const [promotion, setPro] = useState({ move: '', x: -1, y: -1, pre: '' })
	const [moves, setMoves] = useState<{ white: string; black?: string }[]>(() => {
		const saved = localStorage.getItem(storageKeys.moveHistory)
		return saved ? JSON.parse(saved) : []
	})
	const [highlightSquares, setHighlightSquares] = useState<string[]>([])
	const [highlightSquares2, setHighlightSquares2] = useState<string[]>([])
	const [checkSquare, setCheckSquare] = useState<string | null>(null)
	const [resignError, setResignError] = useState('')
	const [isResigning, setIsResigning] = useState(false)

	const playerColor = usePlayerColor(settings.pieceColor, storageKeys.pieceColor)
	const customSquareStyles = useMemo(
		() => createSquareStyles(highlightSquares, highlightSquares2, checkSquare),
		[highlightSquares, highlightSquares2, checkSquare]
	)

	const restartGame = async () => {
		let newGameId: number | undefined
		if (settings.opponent === 'bot' && token) {
			const game = await createGame(settings.opponent, token)
			if (game?.game_id) {
				newGameId = game.game_id
			}
		}
		return newGameId
	}

	useRematchReset({
		rematchId: location.state?.rematchId,
		storage_keys: storageKeys,
		resetGameState: () => {
			setFen(START_FEN)
			setMoves([])
			setRes({ state: 'ongoing', winner: '' })
			setPro({ move: '', x: -1, y: -1, pre: '' })
			setHighlightSquares([])
			setHighlightSquares2([])
			setCheckSquare(null)
		},
	})

	usePersistState(storageKeys.fen, fen, location.state?.rematchId)
	usePersistState(storageKeys.moveHistory, JSON.stringify(moves), location.state?.rematchId)

	const handleResign = async () => {
		localStorage.removeItem(storageKeys.fen)
		localStorage.removeItem(storageKeys.moveHistory)
		setFen(START_FEN)
		setMoves([])
		setResignError('')

		if (!token) {
			setResignError('You must be logged in to resign.')
			return
		}
		if (!gameId) {
			setResignError('No game ID found. Resign is unavailable for this game.')
			return
		}

		setIsResigning(true)
		const data = await resign_game(gameId, token)
		setIsResigning(false)

		if (!data) {
			setResignError('Resign request failed.')
			return
		}

		setRes({ state: 'resign', winner: data.result?.winner || '' })
	}

	const chessboardOptions = {
		position: fen,
		boardOrientation: playerColor,
		darkSquareStyle: { backgroundColor: theme.dark },
		lightSquareStyle: { backgroundColor: theme.light },
		pieces,
		onPieceDrag: ({ square }: PieceHandlerArgs) => {
			if (!square) {
				setHighlightSquares([])
				setHighlightSquares2([])
				return
			}
			legal_moves(fen).then((data) => {
				if (!data) return
				setHighlightSquares(data.moves[square] || [])
				setHighlightSquares2(data.moves2[square] || [])
			})
		},
		onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
			if (!sourceSquare || !targetSquare) return false
			if (result.state !== 'ongoing') return false

			make_move(fen, sourceSquare, targetSquare, gameId).then((data) => {
				if (!data) return
				if (data.promotion !== '') {
					const { x, y } = getBoardCoordinates(targetSquare, playerColor, fen)
					setPro({ move: data.promotion, x, y, pre: fen.split(' ')[1] })
					return
				}

				const moveNotation = `${sourceSquare}${targetSquare}`
				const isWhiteMove = fen.split(' ')[1] === 'w'
				setMoves((prevMoves) => {
					let nextMoves = appendMove(prevMoves, moveNotation, isWhiteMove)
					if (data.bot_move) {
						nextMoves = appendMove(nextMoves, data.bot_move, !isWhiteMove)
					}
					return nextMoves
				})

				setFen(data.fen)
				setRes({ state: data.result || 'ongoing', winner: data.winner || '' })
				setPro({ move: '', x: -1, y: -1, pre: '' })
				setCheckSquare(data.kingpos || null)
			})

			setHighlightSquares([])
			setHighlightSquares2([])
			return false
		},
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex gap-4 items-start">
					<div className="flex flex-col">
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 flex mt-2 items-center justify-between w-[500px]">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-[#3d3d55] border border-[#5a5a7a] flex items-center justify-center text-[#f0eeff] text-xs font-bold">
									{settings.opponent === 'bot' ? 'AI' : '?'}
								</div>
								<span className="text-[#f0eeff] text-sm font-medium">
									{settings.opponent === 'bot' ? `${t('lobby.bot')} (${t(`lobby.${settings.difficulty}`)})` : t('lobby.opponent')}
								</span>
							</div>
							<span className="text-[#e2b96f] text-sm font-mono">
								{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
							</span>
						</div>

						<div className="relative w-[500px]">
							<Chessboard options={{ ...chessboardOptions, squareStyles: customSquareStyles }} />
							<PromotionSelector
								promotion={promotion}
								pieces={pieces}
								fen={fen}
								setMoves={setMoves}
								setFen={setFen}
								setRes={setRes}
								setPro={setPro}
								do_promotion={do_promotion}
							/>
						</div>

						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 mt-2 flex items-center justify-between w-[500px]">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-xs font-bold">
									{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
								</div>
								<span className="text-[#f0eeff] text-sm font-medium">
									{user?.username || user?.email || 'You'}
								</span>
							</div>
							<span className="text-[#e2b96f] text-sm font-mono">
								{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-3 w-48 h-fit mt-2">
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 overflow-y-auto h-[620px]">
							<p className="text-[#8896a4] text-xs mb-2 m-0">{t('game.movesHistory')}</p>
							{moves.length === 0 ? (
								<p className="text-[#2e2e40] text-xs">{t('game.noMoves')}</p>
							) : (
								<div className="text-[#f0eeff] text-xs space-y-1">
									{moves.map((movePair, i) => (
										<div key={i} className="flex gap-2">
											<span className="text-[#8896a4] min-w-[1.5rem]">{i + 1}.</span>
											<span className="text-[#e2b96f]">{movePair.white}</span>
											{movePair.black && <span className="text-[#8896a4]">{movePair.black}</span>}
										</div>
									))}
								</div>
							)}
						</div>
						<button
							onClick={handleResign}
							disabled={isResigning}
							className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]"
						>
							{isResigning ? 'Resigning...' : t('game.resign')}
						</button>
						<button className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f]">
							{t('game.draw')}
						</button>
						{resignError && <p className="text-[#e25f5f] text-xs m-0">{resignError}</p>}
					</div>

					{result.state !== 'ongoing' && (
						<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4">
							<div className="w-full max-w-2xl rounded-2xl border border-[#2e2e40] bg-[#1a1a24] p-6 shadow-2xl flex flex-col max-h-[80vh]">
								<div className="text-center mb-4">
									<p className="text-[#8892a4] text-xs uppercase tracking-[0.3em] mb-2">Game Over</p>
									<h2 className="text-[#f0eeff] text-2xl font-semibold mb-2">{result.winner ? `${result.winner} Won!` : 'Draw'}</h2>
									<p className="text-[#e2b96f] text-lg font-mono">State: {result.state}</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										className="flex-1 rounded-lg bg-[#81b64c] px-4 py-2.5 font-semibold text-white cursor-pointer"
										onClick={async () => {
											const newGameId = await restartGame()
											if (!newGameId) return
											navigate('/game', { state: { ...settings, game_id: newGameId, rematchId: newGameId } })
										}}
									>
										Rematch
									</button>
									<button
										type="button"
										className="flex-1 rounded-lg bg-[#3a3937] px-4 py-2.5 font-semibold text-[#f0eeff] cursor-pointer"
										onClick={() => navigate('/')}
									>
										Home
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default GamePage
