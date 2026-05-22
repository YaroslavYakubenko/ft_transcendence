import { useState, useMemo } from "react"
import { Chessboard } from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import { useLocation } from "react-router-dom"
import { make_move, legal_moves, do_promotion } from "../api/game"

import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Gameover from "../components/Gameover"
import PlayerPanel from "../components/PlayerPanel"
import OpponentPanel from "../components/OpponentPanel"
import MoveHistoryPanel from "../components/MoveHistoryPanel"
import PromotionSelector from "../components/PromotionSelector"

import { loadFen, loadMoves } from "../chess/storage"
import { PIECE_THEMES, BOARD_THEMES, createSquareStyles } from "../chess/themes"
import { START_FEN, DEFAULT_SETTINGS, getStorageKeys, type GameSettings } from "../chess/constants"
import { usePersistState, useRematchReset, usePlayerColor, useRestartGame, useResignGame } from "../chess/hooks"
import { appendMove, getBoardCoordinates, createOnPieceDrag, createOnPieceDrop, getGameId } from "../chess/utils"

function GamePage() {
	const { user, token } = useAuth()
	const location = useLocation()

// variables ----------------------------------------

	// setting vars ----------------------------------------
	const settings: GameSettings = location.state ?? DEFAULT_SETTINGS
	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]
	const gameId = getGameId(location.state)
	const storage_keys = getStorageKeys(gameId) // for local storage persistance

	// highlight/ special squares ----------------------------------------
	const [highlightSquares, setHighlightSquares] = useState<string[]>([])
	const [highlightSquares2, setHighlightSquares2] = useState<string[]>([])
	const [checkSquare, setCheckSquare] = useState<string | null>(null)
	const customSquareStyles = useMemo(() =>
		createSquareStyles( highlightSquares, highlightSquares2, checkSquare ),
		[highlightSquares, highlightSquares2, checkSquare]
	);

	// game vars ----------------------------------------
	const [fen, setFen] = useState(() => {
		return loadFen(storage_keys.fen, location.state?.rematchId)
	});
	const [moves, setMoves] = useState<{ white: string; black?: string }[]>(() => {
		return loadMoves(storage_keys.move_history)
	});
	const [result, setRes] = useState( {state: "ongoing", winner: "" })
	const [promotion, setPro] = useState({ move: "", x: -1, y: -1, pre: "" })

// react hooks?? what do you call it ----------------------------------------

	const playerColor = usePlayerColor( settings.pieceColor, storage_keys.piece_color )

	// calls the create game function and returns its game id, 
	const restartGame = useRestartGame(settings, token)

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

	// update local fen & move history on change
	usePersistState(storage_keys.fen, fen, location.state?.rematchId)
	usePersistState(storage_keys.move_history, JSON.stringify(moves), location.state?.rematchId)

	// handle resign 
	const {handleResign, resignError,isResigning} = useResignGame(
		storage_keys, token, gameId,
		setFen, setMoves, setRes
	)

// Piece movement actions ----------------------------------------

	const onPieceDrag = createOnPieceDrag({
		fen,
		setHighlightSquares, setHighlightSquares2,
		legal_moves,
	});
	const onPieceDrop = createOnPieceDrop({
		fen, gameId, playerColor,
		make_move,
		getBoardCoordinates,
		appendMove,
		setMoves, setFen, setRes, setPro,
		setCheckSquare, setHighlightSquares, setHighlightSquares2,
	});

	const chessboardOptions =
	{
		position: fen,
		boardOrientation: playerColor,
		darkSquareStyle: { backgroundColor: theme.dark },
		lightSquareStyle: { backgroundColor: theme.light },
		pieces: pieces,

		onPieceDrag,
		onPieceDrop,
	};
	
	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex gap-4 items-start">

					{/* Left - board + player pannels */}
					<div className="flex flex-col">

						{/* Opponent panel */}
						<OpponentPanel
							settings={settings}
						/>

						{/* Board */}
						<div className="relative w-[500px]">
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
						< PlayerPanel
							settings={settings}
							user={user}
						/>

					</div>

					{/* Right - move history + buttons */}
					<MoveHistoryPanel
						moves={moves}
						onResign={handleResign}
						isResigning={isResigning}
						resignError={resignError}
					/>

					{/* gameover	make better with rematch option and stuff*/}
					< Gameover
						result={result}
						settings={settings}
						restartGame={restartGame}
					/>
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
