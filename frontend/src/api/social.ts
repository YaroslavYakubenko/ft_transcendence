

const API = import.meta.env.VITE_API_URL

export interface UserProfile {
	id: number
	email: string
	username: string
	wins: number
	losses: number
	avatarUrl: string | null
	isBot?: boolean
	isOnline?: boolean
}

export interface Friend extends UserProfile {
	isOnline: boolean
}

export interface ChatMessage {
	id: number
	fromId: number
	toId: number
	text: string
	timestamp: string
}

// Friends API

export async function getFriends(token: string): Promise<Friend[]> {
	const res = await fetch(`${API}/friends/`, {
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch friends')
	const data = await res.json()
	return data.map((f: { id: number; email: string; username: string; avatar: string; is_online: boolean; is_bot?: boolean }) => ({
		id: f.id,
		email: f.email,
		username: f.username,
		wins: f.wins ?? 0,
		losses: f.losses ?? 0,
		avatarUrl: f.avatar || null,
		isBot: f.is_bot ?? false,
		isOnline: f.is_online
	}))
}

export async function addFriend(userId: number, token: string): Promise<void> {
	const res = await fetch(`${API}/friends/${userId}/`, {
		method: 'POST',
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('Failed to add friend')
}

export async function searchUsers(query: string, token: string): Promise<UserProfile[]> {
	const trimmedQuery = query.trim()
	if (!trimmedQuery) return []

	const res = await fetch(`${API}/friends/search/?q=${encodeURIComponent(trimmedQuery)}`, {
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('Failed to search users')
	const data = await res.json()
	return data.map((user: any) => ({
		id: user.id,
		email: user.email,
		username: user.username,
		wins: user.wins ?? 0,
		losses: user.losses ?? 0,
		avatarUrl: user.avatar || null,
		isBot: user.is_bot ?? false,
		isOnline: user.is_online ?? false,
	}))
}

export async function removeFriend(userId: number, token: string): Promise<void> {
	const res = await fetch(`${API}/friends/${userId}/remove/`, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('Failed to remove friend')
}

// Users API

export async function getUserProfile(userId: number, token: string): Promise<UserProfile> {
	const res = await fetch(`${API}/users/${userId}/`, {
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('User not found')
	const data = await res.json()
	return {
		id: data.id,
		email: data.email,
		username: data.username,
		wins: data.wins ?? 0,
		losses: data.losses ?? 0,
		avatarUrl: data.avatar || null,
		isBot: data.is_bot ?? false,
		isOnline: data.is_online ?? false,
	}
}

// Chat API

export async function getMessages(_withUserId: number, _token: string): Promise<ChatMessage[]> {
	return []
}

export async function sendMessage(_toId: number, _text: string, _token: string): Promise<void> {
	// chat not implemented yet
}