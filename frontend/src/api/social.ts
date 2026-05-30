

const API = import.meta.env.VITE_API_URL

export interface UserProfile {
	id: number
	email: string
	username: string
	wins: number
	losses: number
	avatarUrl: string | null
}

export interface Friend extends UserProfile {
	isOnline: boolean
}

export interface ChatMessage 
{
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
	return data.map((f: { id: number; email: string; username: string; avatar: string; is_online: boolean }) => ({
		id: f.id,
		email: f.email,
		username: f.username,
		wins: 0,
		losses: 0,
		avatarUrl: f.avatar || null,
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
	return { ...data, wins: 0, losses: 0, avatarUrl: data.avatar || null }
}

// Chat API

export async function getMessages(_withUserId: number, _token: string): Promise<ChatMessage[]> {
	return []
}

export async function sendMessage(_toId: number, _text: string, _token: string): Promise<void> {
	// chat not implemented yet
}