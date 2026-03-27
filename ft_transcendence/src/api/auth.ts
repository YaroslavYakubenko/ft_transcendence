

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