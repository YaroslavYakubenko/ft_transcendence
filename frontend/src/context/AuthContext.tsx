// state variable is watched by React -> when it changes, React updates the screen / rerenders the component

// App starts -> AuthProvider mounts 
// AuthProvider reads token from localStorage
// if token exists -> ask backend for user data
// provide {user, token, login, logout ...} to all children

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
	login: (token: string, user: User) => void						// function to login
	logout: () => void												// function to logout
	updateUser: (updates: Partial<User>) => void					// function to update user data
	deleteAccount: () => Promise<void>								// function to delete account
	isLoggedIn: boolean
	sendChat: (to_user_id: number, message: string) => void			// function to send a message
	lastMessage: IncomingMessage | null
}

// creates actual context object
const AuthContext = createContext<AuthContextType | null>(null)		

export function AuthProvider({ children }: { children: React.ReactNode }) 
{

	const [user, setUser] = useState<User | null>(null)				// create a state variable user (at the beginning null, later filled with setUser)

	const [token, setToken] = useState<string | null>(				// create a state variable token
		localStorage.getItem('token')								// reads token from localStorage on startup
	)

	const [lastMessage, setLastMessage] = useState<IncomingMessage | null>(null)
	const wsRef = useRef<WebSocket | null>(null)

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


	
	const updateUser = (updates: Partial<User>) => {									// just partially update the User object, instead of passing the whole user again
		setUser(prev => prev ? { ...prev, ...updates } : prev)							// creates a new object merging old user with new updates
	}

	const deleteAccount = async () => {
		if (token) await apiDeleteAccount(token)
		setUser(null)
		setToken(null)
		localStorage.removeItem('token')
	}

	// if there's a token in localStorage, set User (user stays logged in after a page refresh)
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

	// if user logs in, token appears -> WebSocket opens
	// if user logs out, token becomes null -> WebSocket closes
	useEffect(() => {
		if (!token)
			return

		const ws = new WebSocket(`wss://localhost:8443/ws/status/?token=${token}`)

		ws.onmessage = (e) => {															// e ist the WebSocket message event
			const data = JSON.parse(e.data)
			if (data.type == 'chat')
			{
				setLastMessage({
					from_user_id: data.from_user_id,
					username: data.username,
					message: data.message,
				})
			}
		}

		ws.onerror = (e) => console.error('Status WS error:', e)
		wsRef.current = ws

		return () => {
			ws.close()
			wsRef.current = null
		}
	}, [token])

	function sendChat(to_user_id: number, message: string)
	{
		if (!wsRef.current)
			return;

		wsRef.current.send(JSON.stringify({to_user_id, message}))
	}

	return (																			// makes values available to all child components
		<AuthContext.Provider value={{
			user,
			token,
			login,
			logout,
			deleteAccount,
			updateUser,
			isLoggedIn: !!token,
			sendChat,
			lastMessage,
		}}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)!