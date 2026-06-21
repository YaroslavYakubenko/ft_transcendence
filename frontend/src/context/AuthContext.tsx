// state variable is watched by React -> when it changes, React updates the screen / rerenders the component

// App starts -> AuthProvider mounts 
// AuthProvider reads token from localStorage
// if token exists -> ask backend for user data
// provide {user, token, login, logout ...} to all children

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { getMe, logout as apiLogout, deleteAccount as apiDeleteAccount } from "../api/auth"

interface User 
{
	id: number
	email: string
	username?: string
	avatarUrl?: string
}

interface IncomingMessage
{
	from_user_id: number
	username: string
	message: string
}

interface FriendsUpdate
{
	user_id: number
	is_online: boolean
}

interface FriendRemoved
{
	removed_by_id: number
}

interface FriendAdded
{
	added_by_id: number
}

// AuthContextType = blue print / declaration
// there will be a "user", "token" and "last message" field
interface AuthContextType 
{
	user: User | null
	token: string | null
	login: (token: string, user: User) => void						// function to login
	logout: () => void												// function to logout
	updateUser: (updates: Partial<User>) => void					// function to update user data
	deleteAccount: () => Promise<void>								// function to delete account
	isLoggedIn: boolean
	sendChat: (to_user_id: number, message: string) => void			// function to send a message
	lastMessage: IncomingMessage | null
	friendsUpdate: FriendsUpdate | null
	friendRemoved: FriendRemoved | null
	friendAdded: FriendAdded | null
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
	const [friendsUpdate, setFriendsUpdate] = useState<FriendsUpdate | null>(null)
	const [friendRemoved, setFriendRemoved] = useState<FriendRemoved | null>(null)
	const [friendAdded, setFriendAdded] = useState<FriendAdded | null>(null)

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
		if (!token)
		{
			setUser(null)
			return
		}

		const controller = new AbortController()
		getMe(token, controller.signal)
			.then(function(user){
				setUser(user)
			})
			.catch(function(error){
				if (error.name === 'AbortError') return
				localStorage.removeItem('token')
				setToken(null)
				setUser(null)
			})

		return () => controller.abort()
	}, [token])

	// if user logs in, token appears -> WebSocket opens
	// if user logs out, token becomes null -> WebSocket closes
	useEffect(() => {
		if (!token)
		{
			wsRef.current?.close()
			wsRef.current = null
			return
		}

		let isClosed = false
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
		const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8443`
		const socketUrl = `${WS_URL}/ws/status/?token=${token}`

		function connect() {
			if (isClosed) return

			const ws = new WebSocket(socketUrl)
			wsRef.current = ws

			ws.onmessage = (e) => {
				const data = JSON.parse(e.data)

				if (data.type === 'chat')
				{
					setLastMessage({
						from_user_id: data.from_user_id,
						username: data.username,
						message: data.message,
					})
				}
				else if (data.type === 'presence')
				{
					setFriendsUpdate({
						user_id: data.user_id,
						is_online: data.is_online,
					})
				}
				else if (data.type === 'friend_removed')
				{
					setFriendRemoved({ removed_by_id: data.removed_by_id })
				}
				else if (data.type === 'friend_added')
				{
					setFriendAdded({ added_by_id: data.added_by_id })
				}
			}

			ws.onerror = () => {}

			ws.onclose = () => {
				if (isClosed) return
				reconnectTimeout = setTimeout(connect, 3000)
			}
		}

		connect()

		return () => {
			isClosed = true
			if (reconnectTimeout) clearTimeout(reconnectTimeout)
			wsRef.current?.close()
			wsRef.current = null
		}
	}, [token])

	function sendChat(to_user_id: number, message: string)
	{
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
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
			friendsUpdate,
			friendRemoved,
			friendAdded,
		}}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)!