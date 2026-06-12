
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { sideChoice } from "../chess/utils"
import { resign_game, createGame } from "../api/game"
import { START_FEN } from "./constants"

interface UseRematchResetProps {
	rematchId?: number
	storage_keys: {
		fen: string
		move_history: string
	}
	resetGameState: () => void
}

export function usePersistState( 
	key: string, 
	value: string,
	rematchId?: number,
) {
	useEffect(() => {
		if (rematchId) return;

		localStorage.setItem(key, value);
	}, [key, value, rematchId]);
}

export function useRematchReset({ 
	rematchId, 
	storage_keys, 
	resetGameState 
}: UseRematchResetProps) {
	const location = useLocation()
	const navigate = useNavigate()
	useEffect(() => {
		if (!rematchId) return

		localStorage.removeItem(storage_keys.fen)
		localStorage.removeItem(storage_keys.move_history)
		resetGameState()
		navigate(location.pathname, {
			replace: true,
			state: {
				...location.state,
				rematchId: undefined,
			},
		})
	}, [rematchId])
}

export function usePlayerColor(
	pieceColor: "white" | "black" | "random",
	storageKey: string
) {
	return useMemo(() => {
		const saved = localStorage.getItem(storageKey)
		// console.log("usePlayerColor | saved: ", saved)
		// console.log("usePlayerColor | pieceColor: ", pieceColor)

		if (saved === "white" || saved === "black") {
			return saved
		}

		const resolved = sideChoice(pieceColor)

		localStorage.setItem(storageKey, resolved)

		// console.log("usePlayerColor | resolved: ", resolved)
		return resolved
	}, [pieceColor, storageKey])
}

export function useResignGame(storage_keys: any, token: string | null, gameId: number | null, setFen: any, setMoves: any, setRes: any) {
	const [resignError, setResignError] = useState("")
	const [isResigning, setIsResigning] = useState(false)

	const handleResign = async () => {
		localStorage.removeItem(storage_keys.fen)
		localStorage.removeItem(storage_keys.move_history)

		setFen(START_FEN)
		setMoves([])
		setResignError("")

		if (!token) {
			setResignError("You must be logged in to resign.")
			return
		}

		if (!gameId) {
			setResignError("No game ID found. Resign is unavailable for this game.")
			return
		}

		setIsResigning(true)
		const data = await resign_game(gameId, token)
		setIsResigning(false)

		if (!data) {
			setResignError("Resign request failed.")
			return
		}

		setRes({ state: "Resign", winner: data.result })
	}

	return { handleResign, resignError, isResigning }
}

export function useChessTimer(
	timerSetting: string,
	fen: string,
	isGameOver: boolean,
	effectiveColor: 'white' | 'black' | null,
	onTimeout: (loser: 'white' | 'black') => void
) {
	const initialSeconds = timerSetting === 'none' ? null : parseInt(timerSetting) * 60
	const [whiteTime, setWhiteTime] = useState<number | null>(initialSeconds)
	const [blackTime, setBlackTime] = useState<number | null>(initialSeconds)
	const onTimeoutRef = useRef(onTimeout)
	useEffect(() => { onTimeoutRef.current = onTimeout })

	const fenTurn = fen.split(' ')[1] ?? 'w'

	useEffect(() => {
		if (initialSeconds === null || isGameOver) return

		const whiteTurn = fenTurn === 'w'
		console.log('[Timer] fenTurn:', fenTurn, '→ ticking:', whiteTurn ? 'white' : 'black')

		const id = setInterval(() => {
			if (whiteTurn) {
				setWhiteTime(t => {
					if (t === null || t <= 0) return t
					if (t === 1) { onTimeoutRef.current('white'); return 0 }
					return t - 1
				})
			} else {
				setBlackTime(t => {
					if (t === null || t <= 0) return t
					if (t === 1) { onTimeoutRef.current('black'); return 0 }
					return t - 1
				})
			}
		}, 1000)

		return () => clearInterval(id)
	}, [fenTurn, isGameOver])

	const playerTime = effectiveColor === 'white' ? whiteTime : effectiveColor === 'black' ? blackTime : null
	const opponentTime = effectiveColor === 'white' ? blackTime : effectiveColor === 'black' ? whiteTime : null
	return { playerTime, opponentTime }
}

export function useRestartGame(
	settings: any, 
	pieceColor: 'white' | 'black' | 'random',
	token: string | null
) {
	const restartGame = async () => {
		let gameId: number | undefined
		let user

		if (settings.opponent === "bot" && token) {
			const game = await createGame(settings.opponent, pieceColor, token)
			if (game?.game_id) {
				gameId = game.game_id
			}
			// console.log("useRestartGame | game user color:", game.user)
			user = game.user
		}
		return {gameId, user}
	}
	return restartGame
}
