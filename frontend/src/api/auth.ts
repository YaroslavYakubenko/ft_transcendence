
const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

function getRedirectUri(): string {
	return `${window.location.origin}/oauth/callback`
}

export type OAuthProvider = 'github' | '42'

interface User {
	id: number
	email: string
}

interface LoginResponse {
	token: string
	user: User
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
	try {
		const data = await res.json()
		if (typeof data?.error === 'string' && data.error) return data.error
	} catch {
		// ignore malformed JSON and fall back
	}
	return fallback
}

export async function login(email: string, _password: string): Promise<LoginResponse> {
	const res = await fetch(`${API}/auth/login/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password: _password })
	})
	if (res.status === 403) throw new Error('EMAIL_NOT_VERIFIED')
	if (!res.ok) throw new Error(await getErrorMessage(res, 'Invalid email or password'))
	const data = await res.json()
	const user = await getMe(data.token)
	return { token: data.token, user }
}

export async function register(email: string, _password: string): Promise<{ message: string }> {
	const res = await fetch(`${API}/auth/register/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password: _password })
	})
	if (!res.ok) throw new Error(await getErrorMessage(res, 'Registration failed'))
	const data = await res.json()
	return { message: data.message }
}

export async function getMe(_token: string, signal?: AbortSignal): Promise<User> {
	const res = await fetch(`${API}/auth/me/`, {
		headers: { 'Authorization': `Token ${_token}` },
		signal,
	})
	if (res.status === 401) throw new Error('Unauthorized')
	if (!res.ok) throw new Error('NetworkError')
	const data = await res.json()
	return { ...data, avatarUrl: data.avatar || null }
}

export async function logout(_token: string): Promise<void> {
	const res = await fetch(`${API}/auth/logout/`, {
		method: 'POST',
		headers: { 'Authorization': `Token ${_token}` }
	})
	if (!res.ok) throw new Error('Logout failed')
}


export function buildOAuthUrl(provider: OAuthProvider, state: string): string {
	const redirectUri = getRedirectUri()
	const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
	if (provider === 'github') {
		const githubClientId = isLocalhost
			? import.meta.env.VITE_GITHUB_CLIENT_ID
			: import.meta.env.VITE_GITHUB_CLIENT_ID_IP
		return `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(state)}`
	}
	const fortyTwoClientId = isLocalhost
		? import.meta.env.VITE_FORTY_TWO_CLIENT_ID
		: import.meta.env.VITE_FORTY_TWO_CLIENT_ID_IP
	return `https://api.intra.42.fr/oauth/authorize?client_id=${fortyTwoClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public&state=${encodeURIComponent(state)}`
}

export async function getOAuthState(provider: OAuthProvider): Promise<string> {
	const res = await fetch(`${API}/auth/oauth/state/?provider=${provider}`, {
		credentials: 'include',
	})
	if (!res.ok) throw new Error('Failed to get OAuth state')
	const data = await res.json()
	const state: string = data.state
	sessionStorage.setItem(`oauth_state_${provider}`, state)
	return state
}

export async function oauthLogin(provider: OAuthProvider, code: string, state: string): Promise<LoginResponse> {
	const redirectUri = getRedirectUri()
	const res = await fetch(`${API}/auth/oauth/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ provider, code, state, redirect_uri: redirectUri })
	})
	if (!res.ok) throw new Error(await getErrorMessage(res, 'OAuth failed'))
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

export async function updateMe(token: string, data: { username?: string; email?: string; avatar?: File | null; password?: string }): Promise<User> {
	const formData = new FormData()
	if (data.username !== undefined) formData.append('username', data.username)
	if (data.email !== undefined) formData.append('email', data.email)
	if (data.avatar) formData.append('avatar', data.avatar)
	if (data.password) formData.append('password', data.password)
	const res = await fetch(`${API}/users/me/`, {
		method: 'PATCH',
		headers: { 'Authorization': `Token ${token}` },
		body: formData
	})
	if (!res.ok) throw new Error('Failed to update profile')
	const resData = await res.json()
	return { ...resData, avatarUrl: resData.avatar || null }
}