import { useState, useMemo }	from "react"
import { useLocation, useNavigate } 	from "react-router-dom"
import { Chessboard} 	from "react-chessboard"
import { useAuth } 			from "../context/AuthContext"
import { useTranslation }	from "react-i18next"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import type { PieceHandlerArgs, PieceDropHandlerArgs } from "react-chessboard"

import { make_move, legal_moves, resign_game, do_promotion, createGame } from "../api/game"

import { START_FEN } from "../chess/constants"
import { PIECE_THEMES, BOARD_THEMES, createSquareStyles } from "../chess/themes"
import { usePersistState, useRematchReset, usePlayerColor } from "../chess/hooks"
import { appendMove, getBoardCoordinates} from "../chess/utils"
import PromotionSelector from "../components/PromotionSelector"


interface GameSettings {
	opponent: 'bot' | 'live'
	difficulty: 'easy' | 'medium' | 'hard'
	timer: 'none' | '3' | '5' | '10'
	pieceColor: 'white' | 'black' | 'random'
	boardTheme: 'default' | 'green' | 'blue' | 'brown'
	pieceTheme: 'default' | 'simple'
	game_id?: number
}

function GamePage() {
	const { user, token } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()

// variables ----------------------------------------

	// setting vars ----------------------------------------
	const settings: GameSettings = location.state ?? {
		opponent: 'bot',
		difficulty: 'medium',
		timer: 'none',
		pieceColor: 'random',
		boardTheme: 'default',
		pieceTheme: 'default',
		game_id: undefined,
	} 
	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]

	// game id
	const locationState = (location.state as Record<string, unknown>) ?? {}
	const gameIdFromState =
		locationState.game_id ??
		locationState.gameId ??
		((locationState.game as { id?: number } | undefined)?.id ?? null)
	const gameId = typeof gameIdFromState === "number" ? gameIdFromState : null
	
	// storage keys for persistance on site reload
	const storage_keys = useMemo(() => ({
		fen: `chess_fen_${gameId ?? "local"}`,
		move_history: `move_history_${gameId ?? "local"}`,
		piece_color: `piece_color_${gameId ?? "local"}`,
	}), [gameId]);

	// highlight squares ----------------------------------------
	const [highlightSquares, setHighlightSquares] = useState<string[]>([])
	const [highlightSquares2, setHighlightSquares2] = useState<string[]>([])
	const [checkSquare, setCheckSquare] = useState<string | null>(null)
	const customSquareStyles = useMemo(
		() =>
			createSquareStyles(
				highlightSquares,
				highlightSquares2,
				checkSquare
			),
		[highlightSquares, highlightSquares2, checkSquare]
	);


	// game vars ----------------------------------------
	const [fen, setFen] = useState(() => {
		if (location.state?.rematchId) return START_FEN;

		return localStorage.getItem(storage_keys.fen) || START_FEN;
	});
	
	const [result, setRes] = useState( {state: "ongoing", winner: "" })
	const [promotion, setPro] = useState({ move: "", x: -1, y: -1, pre: "" })

	const [moves, setMoves] = useState<{ white: string; black?: string }[]>(() => {
		const saved = localStorage.getItem(storage_keys.move_history);
		return saved ? JSON.parse(saved) : [];
	});

	const [resignError, setResignError] = useState<string>("")
	const [isResigning, setIsResigning] = useState(false)


// actions, react hooks?? what do you call it ----------------------------------------

	// set player color
	const playerColor = usePlayerColor( settings.pieceColor, storage_keys.piece_color )


	// calls the create game function and returns its game id, 
	const restartGame = async () => {

		let gameId: number | undefined

		// Keep previous UX: start game even if backend game creation is unavailable.
		if (settings.opponent === 'bot' && token) {
			const game = await createGame(settings.opponent, token)
			if (game?.game_id) {
				gameId = game.game_id
			}
		}
		return gameId
	}

	// when given rematch id reset board to starting positions
	useRematchReset({
		rematchId: location.state?.rematchId,
		storage_keys,
		resetGameState: () => {
			setFen(START_FEN)
			setMoves([])
			setRes({ state: "ongoing", winner: "" })
			setPro({ move: "", x: -1, y: -1, pre: "" })
			setHighlightSquares([])
			setHighlightSquares2([])
			setCheckSquare(null)
		},
	})
	// update local fen on change
	usePersistState(storage_keys.fen, fen, location.state?.rematchId)

	// update local move history on change
	usePersistState(storage_keys.move_history, JSON.stringify(moves), location.state?.rematchId)

	const handleResign = async () => {
		localStorage.removeItem(storage_keys.fen);
		localStorage.removeItem(storage_keys.move_history);
		setFen(START_FEN);
		setMoves([]);

		setResignError("");

		if (!token) {
			setResignError("You must be logged in to resign.");
			return;
		}

		if (!gameId) {
			setResignError("No game ID found. Resign is unavailable for this game.");
			return;
		}

		setIsResigning(true);
		const data = await resign_game(gameId, token);
		setIsResigning(false);

		if (!data) {
			setResignError("Resign request failed.");
			return;
		}

		setRes({state:"Resign", winner: data.result});
	}


	// gameplay loop, essentially
	const chessboardOptions =
	{
		position: fen,
		boardOrientation: playerColor,
		darkSquareStyle: { backgroundColor: theme.dark },
		lightSquareStyle: { backgroundColor: theme.light },
		pieces: pieces,

		onPieceDrag: ({ isSparePiece, piece, square }: PieceHandlerArgs) => {
			console.debug("DEBUG: DRAG BEGIN:", isSparePiece, piece, square);
			if (!square)
			{
				setHighlightSquares([]);
				setHighlightSquares2([]);
				return;
			}
			// saved as var in case of needing debug statements, doesn't work otherwise can remove later
			const currentFen = fen;
			// gets highlights through legal moves 
			legal_moves(currentFen).then((data) => {
				if (!piece) return;
				// saved as vars in case of needing debug statements, doesn't work otherwise
				const newhigh = data.moves[square] || [];
				setHighlightSquares(newhigh);
				const newhigh2 = data.moves2[square] || [];
				setHighlightSquares2(newhigh2);
			});
		},

		onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
			if (!sourceSquare || !targetSquare)
				return false;
			make_move(fen, sourceSquare, targetSquare, gameId).then((data) => {
				if (!data)
					return;
				// get position of the promotion menue 
				if (data.promotion !== '') {
					const { x, y } = getBoardCoordinates(targetSquare, playerColor, fen);
					setPro({move: data.promotion, x: x , y: y, pre: fen.split(" ")[1]})
					return;
				}
				
				// Add move to history
				const moveNotation = `${sourceSquare}${targetSquare}`;
				const isWhiteMove = fen.split(" ")[1] === "w";
				setMoves(prevMoves =>
					appendMove(prevMoves, moveNotation, isWhiteMove)
				);
				
				// update variables
				setFen(data.fen);
				setRes({state:data.result, winner: data.winner});
				setPro({move: data.promotion, x: -1, y: -1, pre: ''})
				setCheckSquare(data.kingpos || null)
			});
			// after movement reset highlights
			setHighlightSquares([]);
			setHighlightSquares2([]);
			return false; // prevent local move, backend is source of truth
		},

	};
	
	const { t } = useTranslation()

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex gap-4 items-start">

					{/* Left - board + player pannels */}
					<div className="flex flex-col">

						{/* Opponent panel */}
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 flex mt-2 items-center justify-between w-[500px]">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-[#3d3d55] border border-[#5a5a7a] flex items-center justify-center text-[#f0eeff] text-xs font-bold">
									{settings.opponent == 'bot' ? 'AI' : '?'}
								</div>
								<span className="text-[#f0eeff] text-sm font-medium">
									{settings.opponent === 'bot' ? `${t('lobby.bot')} (${t(`lobby.${settings.difficulty}`)})` : t('lobby.opponent')}
								</span>
							</div>
							<span className="text-[#e2b96f] text-sm font-mono">
								{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
							</span>
						</div>

						{/* Board */}
						<div className="relative w-[500px]" 
							>
							<Chessboard 
							options={{
								...chessboardOptions,
								squareStyles: customSquareStyles,
							}} />

							{/* promotion, see if clicking outside selector could close it, works weird right now */}
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

						{/* Player panel */}
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

					{/* Right - move history + buttons */}
					<div className="flex flex-col gap-3 w-48">
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 flex-1 overflow-y-auto max-h-[500px]">
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
						{resignError && (
							<p className="text-[#e25f5f] text-xs m-0">{resignError}</p>
						)}
					</div>

					{/* gameover	make better with rematch option and stuff*/}
					{result.state !== "ongoing" && (
						<div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm">
							<div className="w-[320px] rounded-[14px] border border-[#3a3937] bg-[#262522] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-[#f0eeff] flex flex-col gap-4">

								{/* Result header */}
								<div className="text-center">
									<div className="text-[18px] font-bold">
										{result?.winner ? `${result.winner} Won!` : "Draw"}
									</div>

									<div className="mt-1 text-xs text-[#8892a4]">
										Game over
									</div>
								</div>

								{/* Divider */}
								<div className="h-px bg-[#3a3937]" />

								{/* Buttons */}
								<div className="flex gap-2.5">
									<button
										type="button"
										className="flex-1 rounded-lg bg-[#81b64c] px-4 py-2.5 font-semibold text-white cursor-pointer"
										onClick={async () => {
											const newGameId = await restartGame()

											if (!newGameId) {
												console.error("Failed to create rematch")
												return
											}

											navigate("/game", {
												state: {
													...settings,
													game_id: newGameId,
													rematchId: newGameId,
												},
											})
										}}
									>
										Rematch
									</button>

									<button
										type="button"
										className="flex-1 rounded-lg bg-[#3a3937] px-4 py-2.5 font-semibold text-[#f0eeff] cursor-pointer"
										onClick={() => navigate("/")}
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

// tabading@example.com Hello1295!

// resign assumes player is always white 
// promoting into checkmate = undefiened Won
// change game over screen to include type of win like, "white won" -> checkmate, "Draw" -> stalemate etc.
// when reloading in gameover screen it dissapears and you're stuck
