
import { START_FEN } from "./constants"

export function loadFen(
	key: string,
	rematchId?: number
) {
	if (rematchId) return START_FEN

	return localStorage.getItem(key) || START_FEN
}


export function loadMoves(key: string) {
	const saved = localStorage.getItem(key)
	return saved ? JSON.parse(saved) : [];
}


type GameResult = {
	state: string
	winner: string
}

export function loadResult(key: string): GameResult {
	const saved = localStorage.getItem(key)

	if (!saved) {
		return { state: "ongoing", winner: "" }
	}

	return JSON.parse(saved)
}