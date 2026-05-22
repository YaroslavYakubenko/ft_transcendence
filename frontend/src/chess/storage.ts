
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