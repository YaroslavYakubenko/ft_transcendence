
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { sideChoice } from "../chess/utils"


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

