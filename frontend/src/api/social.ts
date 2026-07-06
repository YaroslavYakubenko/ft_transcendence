// frontend API helper file

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

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

export async function getFriends(token: string, signal?: AbortSignal): Promise<Friend[]> {
	const res = await fetch(`${API}/friends/`, {
		headers: { 'Authorization': `Token ${token}` },
		signal,
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
	
	window.dispatchEvent(new Event("friendsChanged"))
}

export async function removeFriend(userId: number, token: string): Promise<void> {
	const res = await fetch(`${API}/friends/${userId}/remove/`, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) 
		throw new Error('Failed to remove friend')

	window.dispatchEvent(new Event("friendsChanged"))
}

// Users API

export async function getUserProfile(userId: number, token: string): Promise<UserProfile> {
	const res = await fetch(`${API}/users/${userId}/`, {
		headers: { 'Authorization': `Token ${token}` }
	})
	if (!res.ok) throw new Error('User not found')
	const data = await res.json()
	return { ...data, wins: data.wins || 0, losses: data.losses || 0, avatarUrl: data.avatar || null }
}

// Chat API to communicate with Django backend endpoints 
// POST /api/chat/send
export async function sendMessage(toId: number, text: string, token: string): Promise<ChatMessage> {
	const res = await fetch(`${API}/chat/send/`, 
	{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${token}`,
		},
		body: JSON.stringify({
			to_user_id: toId,
			message: text,
		}),
	})

	if (!res.ok)
		throw new Error('Failed to send message')

	const data = await res.json()

	return {
		id: data.id,
		fromId: data.from_user_id,
		toId: data.to_user_id,
		text: data.message,
		timestamp: new Date(data.created_at).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		}),
	}
}

// GET /api/chat/<friendId>/
export async function getMessages(withUserId: number, token: string, signal?: AbortSignal): Promise<ChatMessage[]> {
	const res = await fetch(`${API}/chat/${withUserId}/`, {
		method: 'GET',
		headers: {
			'Authorization': `Token ${token}`,
		},
		signal,
	})

	if (!res.ok)
		throw new Error('Failed to load messages')

	const data = await res.json()
	console.log("FIRST RAW MESSAGE:", data[0])

	return data.map((msg: any) => ({
		id: msg.id,
		fromId: msg.fromId,
		toId: msg.toId,
		text: msg.text,
		timestamp: msg.timestamp,
	}))
}

