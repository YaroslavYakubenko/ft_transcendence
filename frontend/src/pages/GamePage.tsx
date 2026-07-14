import { useState, useMemo, useEffect, useRef } from "react"
import { Chessboard } from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import { useLocation } from "react-router-dom"
import { make_move, legal_moves, do_promotion, resign_game } from "../api/game"
import { useToast } from "../context/ToastContext"
import { useTranslation } from "react-i18next"

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
import { appendMove, getBoardCoordinates, createOnPieceDrag, createOnPieceDrop, getGameId, requiresPromotion } from "../chess/utils"



function GamePage() {
	const { user, token } = useAuth()
	const { showToast } = useToast()
	const { t } = useTranslation()
	const userRef = useRef(user)
	useEffect(() => { userRef.current = user }, [user])
	const location = useLocation()
	const wsRef = useRef<WebSocket | null>(null)							// creates a React ref that will store the WebSocket connection

// variables ----------------------------------------

	// setting vars ----------------------------------------
	const [settings] = useState<GameSettings>(() => {
		if (location.state) {
			const stateSettings = location.state as GameSettings
			// location.state survives F5 in browser history but may have a stale timer
			// (P2's lobby default). Check for a sync-corrected timer saved separately.
			const syncedTimer = stateSettings.game_id
				? localStorage.getItem(`timer_sync_${stateSettings.game_id}`)
				: null
			const result = syncedTimer
				? { ...stateSettings, timer: syncedTimer as GameSettings['timer'] }
				: stateSettings
			localStorage.setItem('game_session', JSON.stringify(result))
			return result
		}
		try {
			const saved = localStorage.getItem('game_session')
			return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
		} catch { return DEFAULT_SETTINGS }
	})
	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]
	const gameId = getGameId(settings)
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

	// stores moves history
	const [moves, setMoves] = useState<{ white: string; black?: string }[]>(() => {
		return loadMoves(storage_keys.move_history)
	});

	const [result, setRes] = useState(() => {
		return loadResult(storage_keys.result)
	})
	const [promotion, setPro] = useState({ move: "", x: -1, y: -1, pre: "" })
	const [liveColor, setLiveColor] = useState<'white' | 'black' | null>(null)
	const [activeTimer, setActiveTimer] = useState(settings.timer)
	const liveColorRef = useRef<'white' | 'black' | null>(null)
	const [opponent, setOpponent] = useState<{ id: number; name: string } | null>(null)
	const opponentRef = useRef<{ id: number; name: string } | null>(null)
	const [drawState, setDrawState] = useState<'idle' | 'offer_sent' | 'offer_received'>('idle')
	const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// react hooks?? what do you call it ----------------------------------------

	const restartGame  = useRestartGame(settings, settings.pieceColor, token, activeTimer)
	const playerColor = usePlayerColor( settings.userColor, storage_keys.piece_color )

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

	// update local fen & move history & state on change
	usePersistState(storage_keys.fen, fen, location.state?.rematchId)
	usePersistState(storage_keys.move_history, JSON.stringify(moves), location.state?.rematchId)
	usePersistState(storage_keys.result, JSON.stringify(result), location.state?.rematchId )

	// Clear the saved game session when the game ends so it can't be accidentally resumed
	useEffect(() => {
		if (result.state !== 'ongoing') {
			localStorage.removeItem('game_session')
			if (gameId) localStorage.removeItem(`timer_sync_${gameId}`)
		}
	}, [result.state])

	const {handleResign, resignError,isResigning} = useResignGame(
		storage_keys, token, gameId,
		setFen, setMoves, setRes
	)

	const effectiveSettings = { ...settings, timer: activeTimer }
	const effectiveColor = (multiplayer && liveColor) ? liveColor : playerColor
	const colorForTimer = effectiveColor
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
		},
		gameId
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
		if (!multiplayer || !gameId || !token)
			return

		let isClosed = false
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

		const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8443`
		const socketUrl = `${WS_URL}/ws/game/${gameId}/?token=${token}`

		function connect() {
			if (isClosed) return

			const socket = new WebSocket(socketUrl)
			wsRef.current = socket

			socket.onmessage = function(event)
			{
				if (isClosed) return

				const data = JSON.parse(event.data)

				if (data.msg_type === 'sync')
				{
					setFen(data.fen)

					const color = (data.your_color === 'white' ? 'white' : 'black') as 'white' | 'black'
					setLiveColor(color)
					liveColorRef.current = color

					if (data.opponent_id && data.opponent_name) {
						const opp = { id: data.opponent_id, name: data.opponent_name }
						setOpponent(opp)
						opponentRef.current = opp
					}

					if (data.timer) {
						setActiveTimer(data.timer)
						// Save synced timer under a dedicated key so it survives F5
						// (location.state also survives F5 and would otherwise overwrite it)
						if (gameId) localStorage.setItem(`timer_sync_${gameId}`, data.timer)
						try {
							const saved = localStorage.getItem('game_session')
							if (saved) localStorage.setItem('game_session', JSON.stringify({ ...JSON.parse(saved), timer: data.timer }))
						} catch {}
					}

					// Override any stale localStorage result — DB is the source of truth
					if (data.status !== 'completed')
						setRes({ state: 'ongoing', winner: '' })
				}

				else if (data.msg_type === 'player_connected') {
					// Cancel any pending disconnect timeout (opponent reconnected in time)
					if (disconnectTimerRef.current) {
						clearTimeout(disconnectTimerRef.current)
						disconnectTimerRef.current = null
					}
					if (!opponentRef.current)
						showToast(t('toast.opponentJoined'))
				}

				else if (data.msg_type === 'player_disconnected') {
					// Give 30 seconds for reconnect before ending the game.
					// WS briefly drops during page refresh / network hiccup — don't end immediately.
					if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
					disconnectTimerRef.current = setTimeout(() => {
						disconnectTimerRef.current = null
						setRes({ state: 'resign', winner: liveColorRef.current === 'white' ? 'White' : 'Black' })
					}, 30000)
				}

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

				else if (data.msg_type === 'draw_offer')
					setDrawState(prev => {
						if (prev === 'offer_sent') {
							// Both players offered simultaneously — auto-accept
							const socket = wsRef.current
							if (socket?.readyState === WebSocket.OPEN)
								socket.send(JSON.stringify({ type: 'draw_response', accepted: true }))
							return 'idle'
						}
						showToast(t('toast.drawOffered'))
						return 'offer_received'
					})

				else if (data.msg_type === 'draw_accepted')
				{
					setDrawState('idle')
					setRes({ state: 'draw', winner: '' })
				}

				else if (data.msg_type === 'draw_declined') 
				{
					setDrawState('idle')
					showToast(t('toast.drawDeclined'), 'error')
				}
			}

			socket.onclose = () => {
				if (isClosed) return
				reconnectTimeout = setTimeout(connect, 3000)
			}
		}

		connect()

		return () => {
			isClosed = true
			if (reconnectTimeout) clearTimeout(reconnectTimeout)
			if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
			wsRef.current?.close()
		}
	}, [multiplayer, gameId, token])


	// send a move over WS for live games, fall back to HTTP for bot games
	const sendMove = async (currentFen: string, from: string, to: string) => {

		const socket = wsRef.current
		const socketIsOpen = socket?.readyState === WebSocket.OPEN

		if (multiplayer && socketIsOpen)
		{
			// show promotion dialog locally before sending via WS
			if (requiresPromotion(currentFen, from, to)) 
			{
				const { x, y } = getBoardCoordinates(to, effectiveColor, currentFen)
				setPro({ move: from + to, x, y, pre: currentFen.split(' ')[1] })
				return null
			}

			const messageText = JSON.stringify({ type: "move", from, to })
			socket.send(messageText)

			return null
		}

		// non-multiplayer games
		return make_move(currentFen, from, to, gameId)
	}

	const handleWsPromotion = (promo: string) => {
		const from = promotion.move.substring(0, 2)
		const to = promotion.move.substring(2, 4)
		const socket = wsRef.current
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'move', from, to, promotion: promo }))
		}
	}


// Draw actions ----------------------------------------

	const handleDrawOffer = () => {
		const socket = wsRef.current
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'draw_offer' }))
			setDrawState('offer_sent')
		}
	}

	const handleDrawAccept = () => {
		const socket = wsRef.current
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'draw_response', accepted: true }))
			setDrawState('idle')
		}
	}

	const handleDrawDecline = () => {
		const socket = wsRef.current
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'draw_response', accepted: false }))
			setDrawState('idle')
		}
	}

// Piece movement actions ----------------------------------------

	const onPieceDrag = createOnPieceDrag({
		fen,
		setHighlightSquares, setHighlightSquares2,
		legal_moves,
		effectiveColor,
	});
	const onPieceDrop = createOnPieceDrop({
		fen, gameId, playerColor: effectiveColor,
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
								onWsPromotion={multiplayer ? handleWsPromotion : undefined}
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
						isGameOver={result.state !== 'ongoing'}
						drawState={multiplayer && result.state === 'ongoing' ? drawState : undefined}
						onDrawOffer={multiplayer && result.state === 'ongoing' ? handleDrawOffer : undefined}
						onDrawAccept={multiplayer && result.state === 'ongoing' ? handleDrawAccept : undefined}
						onDrawDecline={multiplayer && result.state === 'ongoing' ? handleDrawDecline : undefined}
					/>

					{/* gameover make better with rematch option and stuff*/}
					< Gameover
						result={result}
						settings={effectiveSettings}
						user={userRef.current}
						token={token}
						gameId={gameId}
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