import { createContext, useContext, useState, useEffect } from "react"
import { getMe, logout as apiLogout, deleteAccount as apiDeleteAccount } from "../api/auth"

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
	deleteAccount: () => Promise<void>
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

	const deleteAccount = async () => {
		if (token) await apiDeleteAccount(token)
		setUser(null)
		setToken(null)
		localStorage.removeItem('token')
	}

	useEffect(() => {
		if (token) {
			getMe(token)
			.then(user => setUser(user))
			.catch(() => {
				localStorage.removeItem('token')
				setToken(null)
			})
		}
	}, [])
	return (
		<AuthContext.Provider value={{
			user,
			token,
			login,
			logout,
			deleteAccount,
			updateUser,
			isLoggedIn: !!token,
		}}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)!