

interface User {
	id: number
	username: string
}

interface LoginResponse {
	token: string
	user: User
}

export async function login(username: string, password: string): Promise<LoginResponse> {
	
	return {
		token: 'mock-token-123',
		user: {id: 1, username}
	}
}

export async function register(username: string, password: string): Promise<LoginResponse> {

	return {
		token: 'mock-token-123',
		user: { id: 2, username }
	}
}

export async function getMe(token: string): Promise<User> {
	
	return {id: 1, username: 'testuser'}
}

export async function logout(token: string): Promise<void> {
	
}