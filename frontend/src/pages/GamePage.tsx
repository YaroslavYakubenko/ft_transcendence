import { useState, useMemo, useEffect, useRef } from "react"
import { Chessboard } from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import { useLocation } from "react-router-dom"
import { make_move, legal_moves, do_promotion, resign_game } from "../api/game"

import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Gameover from "../components/Gameover"
import PlayerPanel from "../components/PlayerPanel"
import OpponentPanel from "../components/OpponentPanel"
import MoveHistoryPanel from "../components/MoveHistoryPanel"
import PromotionSelector from "../components/PromotionSelector"

import { loadFen, loadMoves, loadResult } from "../chess/storage"
import { PIECE_THEMES, BOARD_THEMES, createSquareStyles } from "../chess/themes"
import { START_FEN, DEFAULT_SETTINGS, getStorageKeys, type GameSettings } from "../chess/constants"
import { usePersistState, useRematchReset, usePlayerColor, useRestartGame, useResignGame, useChessTimer } from "../chess/hooks"
import { appendMove, getBoardCoordinates, createOnPieceDrag, createOnPieceDrop, getGameId } from "../chess/utils"


function GamePage() {
	const { user, token } = useAuth()
	const userRef = useRef(user)
	useEffect(() => { userRef.current = user }, [user])
	const location = useLocation()
	const wsRef = useRef<WebSocket | null>(null)							// creates a React ref that will store the WebSocket connection

// variables ----------------------------------------

	// setting vars ----------------------------------------
	const settings: GameSettings = location.state ?? DEFAULT_SETTINGS
	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]
	// const gameId = 428
	const gameId = getGameId(location.state)
	const storage_keys = getStorageKeys(gameId) // for local storage persistance
	const multiplayer = settings.opponent === 'live'


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
	const [result, setRes] = useState(() => {
		return loadResult(storage_keys.result)
	})
	const [promotion, setPro] = useState({ move: "", x: -1, y: -1, pre: "" })
	const [opponentConnected, setOpponentConnected] = useState(false);
	const [liveColor, setLiveColor] = useState<'white' | 'black' | null>(null)
	const [activeTimer, setActiveTimer] = useState(settings.timer)
	const liveColorRef = useRef<'white' | 'black' | null>(null)
	const [opponent, setOpponent] = useState<{ id: number; name: string } | null>(null)

// react hooks?? what do you call it ----------------------------------------

	// const playerColor = usePlayerColor( settings.pieceColor, storage_keys.piece_color )
	const restartGame  = useRestartGame(settings, settings.pieceColor, token, activeTimer)
	const playerColor = usePlayerColor( settings.userColor, storage_keys.piece_color )

	// when given rematch id reset board to starting positions
	useRematchReset({
		rematchId: location.state?.rematchId,
		storage_keys,
		resetGameState: () => {
			// console.log("id:", gameId)
			// console.log("player color:", playerColor)
			setFen(START_FEN)
			setMoves([])
			setRes({ state: "ongoing", winner: "" })
			setPro({ move: "", x: -1, y: -1, pre: "" })
			setHighlightSquares([])
			setHighlightSquares2([])
			setCheckSquare(null)
		},
	})

	// update local fen & move history & state on change
	usePersistState(storage_keys.fen, fen, location.state?.rematchId)
	usePersistState(storage_keys.move_history, JSON.stringify(moves), location.state?.rematchId)
	usePersistState(storage_keys.result, JSON.stringify(result), location.state?.rematchId )

	const {handleResign, resignError,isResigning} = useResignGame(
		storage_keys, token, gameId,
		setFen, setMoves, setRes
	)

	const effectiveSettings = { ...settings, timer: activeTimer }
	const effectiveColor = (multiplayer && liveColor) ? liveColor : playerColor
	// For multiplayer, don't assign panel times until liveColor is confirmed from sync
	const colorForTimer: 'white' | 'black' | null = (!multiplayer || liveColor !== null) ? effectiveColor : null
	const { playerTime, opponentTime } = useChessTimer(
		activeTimer,
		fen,
		result.state !== 'ongoing',
		colorForTimer,
		async (loser) => {
			setRes({ state: 'timeout', winner: loser === 'white' ? 'Black' : 'White' })
			// Only the losing player notifies the backend so stats update once
			if (loser === colorForTimer && gameId && token) {
				await resign_game(gameId, token)
			}
		}
	)


	// WebSocket for live games ----------------------------------------
	// 	{
	// 		data: '{"msg_type":"move","fen":"some-fen"}',
	// 		type: "message",
	// 		target: WebSocket,
	// 		origin: "ws://localhost:8000",
	// 		lastEventId: "",
	// 		source: null,
	// 		ports: []
	// }

	// event.data might contain '{"msg_type":"move","fen":"new-board-position"}'
	// JSON.parse turns it into a Javascript object 
	// 	{
	// 		msg_type: "move",
	// 		fen: "new-board-position"
	//	}
	useEffect(() => 
	{
		// console.log("multi:", multiplayer)
		// console.log("gameId:", gameId)
		// console.log("token:", token)
		if (!multiplayer || !gameId || !token)
			return

		let isClosed = false

		// opens a live connection to your backend
		const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8443`
		const socketUrl = `${WS_URL}/ws/game/${gameId}/?token=${token}`
		const socket = new WebSocket(socketUrl)
		wsRef.current = socket
		// onmessage and event belong to WebSocket, when the socket receives a message, run this function
		// event is the whole message package
		socket.onmessage = function(event)
		{
			if (isClosed) return

			const data = JSON.parse(event.data)

			console.log("msg type:", data.msg_type)
			if (data.msg_type === 'sync')
			{
				setFen(data.fen)

				const color = (data.your_color === 'white' ? 'white' : 'black') as 'white' | 'black'
				setLiveColor(color)
				liveColorRef.current = color

				if (data.opponent_id && data.opponent_name)
					setOpponent({ id: data.opponent_id, name: data.opponent_name })

				if (data.timer)
					setActiveTimer(data.timer)

				// Override any stale localStorage result — DB is the source of truth
				if (data.status !== 'completed')
					setRes({ state: 'ongoing', winner: '' })
			}

			else if (data.msg_type === 'player_connected')
				setOpponentConnected(true)

			else if (data.msg_type === 'move')
			{
				setFen(data.fen)
				setCheckSquare(data.king_in_check || null)

				const isWhiteMove = data.fen.split(' ')[1] === 'b'
				const notation = data.from + data.to + (data.promotion || '')
				setMoves((prev: any) => appendMove(prev, notation, isWhiteMove))

				if (data.result !== 'ongoing')
					setRes({ state: data.result, winner: data.winner })
			}

			else if (data.msg_type === 'resign')
				setRes({ state: 'resign', winner: data.winner })
		}
		socket.onclose = () => {
			if (!multiplayer || isClosed) return
			setTimeout(() => {
				const newSocket = new WebSocket(socketUrl)
				wsRef.current = newSocket
			}, 3000)
		}
		
		return () => {
			isClosed = true
			socket.close()
		}
	}, [multiplayer, gameId, token])										// run this useEffect again if one of these values changes


	// send a move over WS for live games, fall back to HTTP for bot games
	const sendMove = async (currentFen: string, from: string, to: string) => {

		const socket = wsRef.current
		const socketIsOpen = socket?.readyState === WebSocket.OPEN

		if (multiplayer && socketIsOpen)
		{
			const moveMessage = 
			{
				type: "move", 
				from: from, 
				to: to,
			}

			const messageText = JSON.stringify(moveMessage)
			socket.send(messageText)

			return null
		}

		// non-multiplayer games
		return make_move(currentFen, from, to, gameId)
	}


// Piece movement actions ----------------------------------------

	const onPieceDrag = createOnPieceDrag({
		fen,
		setHighlightSquares, setHighlightSquares2,
		legal_moves,
	});
	const onPieceDrop = createOnPieceDrop({
		fen, gameId, playerColor,
		make_move: sendMove,
		getBoardCoordinates,
		appendMove,
		setMoves, setFen, setRes, setPro,
		setCheckSquare, setHighlightSquares, setHighlightSquares2,
	});

	const chessboardOptions =
	{
		position: fen,
		boardOrientation: (multiplayer && liveColor) ? liveColor : playerColor,
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
							settings={effectiveSettings}
							opponent={opponent}
							time={opponentTime}
						/>

						{/* Board */}
						<div className="relative w-[500px]">
							<Chessboard 
								options={{
									...chessboardOptions,
									squareStyles: customSquareStyles,
								}} />

							{/* promotion */}
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
							settings={effectiveSettings}
							user={user}
							time={playerTime}
						/>

					</div>

					{/* Right - move history + buttons */}
					<MoveHistoryPanel
						moves={moves}
						onResign={handleResign}
						isResigning={isResigning}
						resignError={resignError}
					/>

					{/* gameover make better with rematch option and stuff*/}
					< Gameover
						result={result}
						settings={effectiveSettings}
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

// implement draw button once websockets are in -> question opponent if they agree
// if live player not bot/ pending widget -> display game id, waiting for opponent.
// -> update opponent