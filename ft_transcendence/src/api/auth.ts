

interface User {
	id: number
	email: string
}

interface LoginResponse {
	token: string
	user: User
}

export async function login(email: string, _password: string): Promise<LoginResponse> {
	
	return {
		token: 'mock-token-123',
		user: {id: 1, email}
	}
}

export async function register(email: string, _password: string): Promise<LoginResponse> {

	return {
		token: 'mock-token-123',
		user: { id: 2, email }
	}
}

export async function getMe(_token: string): Promise<User> {
	
	return {id: 1, email: 'test@test.com'}
}

export async function logout(_token: string): Promise<void> {
	
}

const REDIRECT_URI = 'http://localhost:5173/oauth/callback'

export const OAUTH_URLS = {
	github: `https://github.com/login/oauth/authorize?client_id=GITHUB_CLIENT_ID&redirect_uri=${REDIRECT_URI}&scope=user:email`,
	42: `https://api.intra.42.fr/oauth/authorize?client_id=42_CLIENT_ID&response_type=code&redirect_uri=${REDIRECT_URI}&scope=public`,
}

export async function oauthLogin(provider: string, code: string): Promise<LoginResponse> {
	console.log('oauthLogin', provider, code)
	return {
		token: 'moke-oauth-token',
		user: { id: 3, email: `oauth-user@${provider}.com` }
	}
}

export async function deleteAccount(_token: string): Promise<void> {
	// stub - backend will delete user
}