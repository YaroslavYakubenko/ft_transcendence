

export interface UserStats {
	wins: number
	losses: number
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

const API_BASE_URL = 'http://localhost:8000/api'

export async function getUserStats(userId: number): Promise<UserStats> {
	try {
		const response = await fetch(`${API_BASE_URL}/users/${userId}/stats/`, {
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
		return {
			wins: data.wins || 0,
			losses: data.losses || 0,
			rank: data.rank || 0,
			elo: data.elo || 1200,
		}
	} catch (error) {
		console.error('Error fetching user stats:', error)
		// Return default stats on error
		return { wins: 0, losses: 0, rank: 0, elo: 1200 }
	}
}

export async function getMatchHistory(userId: number, page: number = 1): Promise<MatchRecord[]> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/users/${userId}/matches/?page=${page}`,
			{
				method: 'GET',
				headers: {
					'Authorization': `Token ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json',
				},
			}
		)
		
		if (!response.ok) {
			throw new Error(`Failed to fetch match history: ${response.statusText}`)
		}
		
		const data = await response.json()
		return (data.matches || []).map((match: any) => ({
			id: match.id,
			opponentName: match.opponent_name,
			result: match.result,
			date: match.date,
			duration: match.duration,
		}))
	} catch (error) {
		console.error('Error fetching match history:', error)
		return []
	}
}

export async function getAchievements(_userId: number): Promise<Achievement[]> {
	// TODO: Implement achievements in backend
	return [
		{ id: 1, name: "First Win",     description: "Win your first game",       unlocked: true },
		{ id: 2, name: "On a Roll",     description: "Win 3 games in a row",       unlocked: true },
		{ id: 3, name: "Veteran",       description: "Play 10 games",             unlocked: true },
		{ id: 4, name: "Grandmaster",   description: "Reach 2000 elo",            unlocked: false },
		{ id: 5, name: "Untouchable",   description: "Win 5 games without a loss", unlocked: false },
	]
}

export async function getLeaderboard(limit: number = 50): Promise<{ id: number; username: string; wins: number; losses: number; elo: number; rank: number }[]> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/leaderboard/?limit=${limit}`,
			{
				method: 'GET',
				headers: {
					'Authorization': `Token ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json',
				},
			}
		)
		
		if (!response.ok) {
			throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
		}
		
		const data = await response.json()
		return data.leaderboard || []
	} catch (error) {
		console.error('Error fetching leaderboard:', error)
		return []
	}
} 