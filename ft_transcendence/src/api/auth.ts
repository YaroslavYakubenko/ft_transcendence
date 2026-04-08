

const API = 'http://127.0.0.1:8000/api'

interface User {
	id: number
	email: string
}

interface LoginResponse {
	token: string
	user: User
}

export async function login(email: string, _password: string): Promise<LoginResponse> {
	const res = await fetch(`${API}/auth/login/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password: _password })
	})
	if (!res.ok) throw new Error('Invalid credentials')
	const data = await res.json()
	const user = await getMe(data.token)
	return { token: data.token, user }
}

export async function register(email: string, _password: string): Promise<LoginResponse> {
	const res = await fetch(`${API}/auth/register/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password: _password })
	})
	if (!res.ok) throw new Error('Registration failed')
		const data = await res.json()
		const user = await getMe(data.token)
		return { token: data.token, user }
}

export async function getMe(_token: string): Promise<User> {
	const res = await fetch(`${API}/auth/me/`, {
		headers: { 'Authorization': `Token ${_token}` }
	})
	if (!res.ok) throw new Error('Unauthorized')
	const data = await res.json()
	return { ...data, avatarUrl: data.avatar || null }
}

export async function logout(_token: string): Promise<void> {
	await fetch(`${API}/auth/logout/`, {
		method: 'POST',
		headers: { 'Authorization': `Token ${_token}` }
	})
}

const REDIRECT_URI = 'http://localhost:5173/oauth/callback'

export const OAUTH_URLS = {
	github: `https://github.com/login/oauth/authorize?client_id=Ov23lix1FhQAZ8i6AbWi&redirect_uri=${REDIRECT_URI}&scope=user:email`,
	42: `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-4b2f6e56651d5b86d84d654134c18c49a383f60a6faad5acb991f2e66413001c&response_type=code&redirect_uri=${REDIRECT_URI}&scope=public`,
}

export async function oauthLogin(provider: string, code: string): Promise<LoginResponse> {
	const res = await fetch(`${API}/auth/oauth/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ provider, code })
	})
	if (!res.ok) throw new Error('Oauth failed')
		const data = await res.json()
		const user = await getMe(data.token)
		return { token: data.token, user }
}

export async function deleteAccount(_token: string): Promise<void> {
	const res = await fetch(`${API}/users/me/delete/`, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${_token}` }
	})
	if (!res.ok) throw new Error('Failed to delete account')
}

export async function updateMe(token: string, data: { username?: string; email?: string; avatar?: File | null; password?: string }): Promise<void> {
	const formData = new FormData()
	if (data.username !== undefined) formData.append('username', data.username)
	if (data.email !== undefined) formData.append('email', data.email)
	if (data.avatar) formData.append('avatar', data.avatar)
	if (data.password) formData.append('password', data.password)
	await fetch(`${API}/users/me/`, {
		method: 'PATCH',
		headers: { 'Authorization': `Token ${token}` },
		body: formData
	})
}