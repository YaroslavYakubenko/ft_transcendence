

export interface UserStats {
	wins: number
	losses: number
	draws: number
	rank: number
	elo: number
}

export interface MatchRecord {
	id: number
	opponent_name: string
	result: 'win' | 'loss' | 'draw'
	date: string
	duration: string
}

export interface Achievement {
	id: number
	name: string
	description: string
	unlocked: boolean
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const GAME_BASE_URL = window.location.origin

export async function getUserStats(userId: number, signal?: AbortSignal): Promise<UserStats> {
	try {
		const response = await fetch(`${API_BASE_URL}/users/${userId}/stats/`, {
			method: 'GET',
			headers: {
				'Authorization': `Token ${localStorage.getItem('token')}`,
				'Content-Type': 'application/json',
			},
			signal,
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch user stats: ${response.statusText}`)
		}

		const data = await response.json()
		return {
			wins: data.wins || 0,
			losses: data.losses || 0,
			draws: data.draws || 0,
			rank: data.rank || 0,
			elo: data.elo || 1200,
		}
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error
		console.error('Error fetching user stats:', error)
		return { wins: 0, losses: 0, draws: 0, rank: 0, elo: 1200 }
	}
}

export async function getMatchHistory(userId: number, page: number = 1, signal?: AbortSignal): Promise<MatchRecord[]> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/users/${userId}/matches/?page=${page}`,
			{
				method: 'GET',
				headers: {
					'Authorization': `Token ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json',
				},
				signal,
			}
		)

		if (!response.ok) {
			throw new Error(`Failed to fetch match history: ${response.statusText}`)
		}

		const data = await response.json()
		return (data.matches || []).map((match: any) => ({
			id: match.id,
			opponent_name: match.opponent_name,
			result: match.result,
			date: match.date,
			duration: match.duration,
		}))
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error
		console.error('Error fetching match history:', error)
		return []
	}
}

export async function getAchievements(_userId: number): Promise<Achievement[]> {
	// TODO: Implement achievements in backend

	try {
		const response = await fetch(`${API_BASE_URL}/users/${_userId}/stats/`, {
			method: 'GET',
			headers: {
				'Authorization': `Token ${localStorage.getItem('token')}`,
				'Content-Type': 'application/json',
			},

		})

		if (!response.ok) {
			throw new Error(`Failed to fetch user stats: ${response.statusText}`)
		}

		const data = await response.json()
		let bools: boolean[] = new Array(5).fill(false);

		if (data.wins >= 1)
			bools[0] = true;
		if (data.highest_win_streak >= 3)
			bools[1] = true;
		if (data.wins + data.losses >= 10)
			bools[2] = true;
		if (data.elo >= 2000)
			bools[3] = true;
		if (data.highest_win_streak >= 5)
			bools[4] = true;

		return [
		{ id: 1, name: "First Win",     description: "Win your first game",			unlocked: bools[0]},
		{ id: 2, name: "On a Roll",     description: "Win 3 games in a row",		unlocked: bools[1] },
		{ id: 3, name: "Veteran",       description: "Play 10 games",				unlocked: bools[2]},
		{ id: 4, name: "Grandmaster",   description: "Reach 2000 elo",				unlocked: bools[3]},
		{ id: 5, name: "Untouchable",   description: "Win 5 games without a loss",	unlocked: bools[4] },
	]
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error
		console.error('Error fetching user stats:', error)
		return [
		{ id: 1, name: "First Win",     description: "Win your first game",			unlocked: false},
		{ id: 2, name: "On a Roll",     description: "Win 3 games in a row",		unlocked: false},
		{ id: 3, name: "Veteran",       description: "Play 10 games",				unlocked: false},
		{ id: 4, name: "Grandmaster",   description: "Reach 2000 elo",				unlocked: false},
		{ id: 5, name: "Untouchable",   description: "Win 5 games without a loss",	unlocked: false},
	]
	}
}

export async function getLeaderboard(limit: number = 50, signal?: AbortSignal): Promise<{ id: number; username: string; email: string; wins: number; losses: number; elo: number; rank: number }[]> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/leaderboard/?limit=${limit}`,
			{
				method: 'GET',
				headers: {
					'Authorization': `Token ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json',
				},
				signal,
			}
		)

		if (!response.ok) {
			throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
		}

		const data = await response.json()
		return data.leaderboard || []
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error
		console.error('Error fetching leaderboard:', error)
		return []
	}
}


// tabading add

// only create game being used now 
export async function createGame(
	opponent: 'bot' | 'live',
	pieceColor: 'white' | 'black' | 'random',
	token: string | null,
	timer: 'none' | '3' | '5' | '10' = 'none',
	difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) {
	if (!token) {
		return null
	}

	const response = await fetch(`${GAME_BASE_URL}/create-game/`, {
		method: "POST",
		headers: {
			"Authorization": `Token ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			opponent,
			pieceColor,
			timer,
			difficulty,
		}),
	})

	const data = await response.json()
	if (!response.ok || data.error) {
		console.error(data.error || "Failed to create game")
		return null
	}

	return data
}

// make move 
export async function make_move(fen: string, from: string, to: string, gameId?: number | null) {
	const res = await fetch(`${GAME_BASE_URL}/make-move/`, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		fen,
		from,
		to,
		game_id: gameId ?? undefined,
	}),
	});

	const data = await res.json();

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	if (data.log) {
		console.log("LOG:" ,data.log)
		return null; // fallback: no update
	}

	return data;
}

// promote pawn
export async function do_promotion(fen: string, move: string, key: string, gameId?: number | null) {
	const res = await fetch(`${GAME_BASE_URL}/do-promotion/`, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		fen,
		move,
		key,
		game_id: gameId ?? undefined,
	}),
	});

	const data = await res.json();

	// console.log(data);

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	if (data.log) {
		console.log("LOG:" ,data.log)
		return null; // fallback: no update
	}

	return data;
}

// get legal moves to empty and occupied spaces
export async function legal_moves(fen: string) {
	const res = await fetch(`${GAME_BASE_URL}/legal-moves/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			fen,
		}),
	});

	const data = await res.json();

	// console.log(data);

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	return data;
}

export async function resign_game(
	gameId: number | null, 
	token: string | null
) {
	if (!gameId || !token) {
		console.error("Game ID or token missing");
		return null;
	}

	const res = await fetch(`${GAME_BASE_URL}/resign/`, {
		method: "POST",
		headers: {
			"Authorization": `Token ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			game_id: gameId,

		}),
	});

	const data = await res.json();

	if (data.error) {
		console.error(data.error);
		return null;
	}

	return data;
}

export async function check_color(gameId: Number | null, token: string | null, result: string)
{
	if (!gameId || !token) {
		console.error("Game ID or token missing");
		return null;
	}

	const response = await fetch(`${GAME_BASE_URL}/check-color/`, {
		method: "POST",
		headers: {
			"Authorization": `Token ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			gameId,
			result,
		}),
	})


	const data = await response.json();

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}

	return data;
}

export async function check_game_status(gameId: Number | null, token: string | null)
{
	if (!gameId || !token) {
		console.error("Game ID or token missing");
		return null;
	}

	const response = await fetch(`${GAME_BASE_URL}/check-game-status/`, {
		method: "POST",
		headers: {
			"Authorization": `Token ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			gameId,
		}),
	})


	const data = await response.json();

	if (data.error) {
		console.error(data.error);
		return data; 
	}

	return data;
}