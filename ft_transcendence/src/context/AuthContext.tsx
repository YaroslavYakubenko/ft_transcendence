import { createContext, useContext, useState, useEffect } from "react"
import { getMe, logout as apiLogout } from "../api/auth"

interface User {
	id: number
	email: string
	username?: string
	avatarUrl?: string
}

interface AuthContextType {
	user: User | null
	token: string | null
	login: (token: string, user: User) => void
	logout: () => void
	updateUser: (updates: Partial<User>) => void
	isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(
		localStorage.getItem('token')
	)
	const login = (token: string, user: User) => {
		localStorage.setItem('token', token)
		setToken(token)
		setUser(user)
	}
	const logout = () => {
		if (token) {
			apiLogout(token)
		}
		localStorage.removeItem('token')
		setToken(null)
		setUser(null)
	}
	const updateUser = (updates: Partial<User>) => {
		setUser(prev => prev ? { ...prev, ...updates } : prev)
	}
	useEffect(() => {
		if (token) {
			getMe(token).then(user => setUser(user))
		}
	}, [])
	return (
		<AuthContext.Provider value={{
			user,
			token,
			login,
			logout,
			updateUser,
			isLoggedIn: !!token,
		}}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)!