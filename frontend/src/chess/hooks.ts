
import { useEffect, useState } from "react"
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

		if (saved === "white" || saved === "black") {
			return saved
		}

		const resolved = sideChoice(pieceColor)

		localStorage.setItem(storageKey, resolved)

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

export function useRestartGame(settings: any, token: string | null) {
	const restartGame = async () => {
		let gameId: number | undefined

		if (settings.opponent === "bot" && token) {
			const game = await createGame(settings.opponent, token)
			if (game?.game_id) {
				gameId = game.game_id
			}
		}
		return gameId
	}
	return restartGame
}
