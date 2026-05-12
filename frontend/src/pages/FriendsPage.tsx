import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { addFriend, getFriends, removeFriend, searchUsers, type Friend, type UserProfile } from "../api/social"
import { useTranslation } from "react-i18next"

function FriendsPage() {
	const [friends, setFriends] = useState<Friend[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [searchResults, setSearchResults] = useState<UserProfile[]>([])
	const [searching, setSearching] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [searchError, setSearchError] = useState<string | null>(null)
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { token } = useAuth()

	async function refreshFriends() {
		if (!token) return
		try {
			const data = await getFriends(token)
			setFriends(data)
			setLoadError(null)
		} catch {
			setLoadError(t('friends.fetchFailed'))
		}
	}

	useEffect(() => {
		refreshFriends()
	}, [token])

	useEffect(() => {
		if (!token) return

		const query = searchQuery.trim()
		if (query.length < 2) {
			setSearchResults([])
			setSearchError(null)
			setSearching(false)
			return
		}

		let cancelled = false
		setSearching(true)
		setSearchError(null)

		const timeoutId = window.setTimeout(async () => {
			try {
				const results = await searchUsers(query, token)
				if (!cancelled) {
					setSearchResults(results)
				}
			} catch {
				if (!cancelled) {
					setSearchError(t('friends.fetchFailed'))
				}
			} finally {
				if (!cancelled) {
					setSearching(false)
				}
			}
		}, 250)

		return () => {
			cancelled = true
			window.clearTimeout(timeoutId)
		}
	}, [searchQuery, token, t])

	async function handleRemove(userId: number) {
		try {
			if (!token) return
			await removeFriend(userId, token)
			setFriends(prev => prev.filter(f => f.id !== userId))
			setSearchResults(prev => prev.filter(user => user.id !== userId))
			setLoadError(null)
		} catch {
			setLoadError(t('friends.removeFailed'))
		}
	}

	async function handleAdd(userId: number) {
		try {
			if (!token) return
			await addFriend(userId, token)
			setSearchResults(prev => prev.filter(user => user.id !== userId))
			refreshFriends()
		} catch {
			setLoadError(t('friends.addFailed'))
		}
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-16 px-4">
				<h1 className="text-2xl font-bold mb-8">{t('friends.title')}</h1>
				<p className="text-sm text-[#8892a4] mb-6 text-center">
					You can add friends from the leaderboard or search by username below.
				</p>
				<div className="w-full max-w-md mb-6 flex gap-2">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by username"
						className="flex-1 bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 text-[#f0eeff] outline-none focus:border-[#e2b96f]"
					/>
					<div className="bg-[#e2b96f] border-none rounded-xl px-4 py-3 text-[#0f0f13] font-semibold select-none min-w-[112px] text-center">
						{searching ? 'Searching...' : 'Live search'}
					</div>
				</div>
				{searchResults.length > 0 && (
					<div className="w-full max-w-md mb-8">
						<h2 className="text-sm text-[#8892a4] mb-3">Search results</h2>
						<div className="flex flex-col gap-3">
							{searchResults.map(user => (
								<div key={user.id} className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-6 py-4 flex items-center justify-between">
									<div className="flex items-center gap-4">
										{user.avatarUrl ? (
											<img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
										) : (
											<div className="w-10 h-10 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] font-bold">
												{(user.username || user.email)[0].toUpperCase()}
											</div>
										)}
										<div>
											<p className="font-semibold">{user.username || user.email}</p>
											<p className="text-xs text-[#8892a4]">{user.email}</p>
										</div>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => navigate(`/users/${user.id}`)}
											className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-[#e2b96f] cursor-pointer"
										>
											{t('friends.viewProfile')}
										</button>
										<button
											onClick={() => handleAdd(user.id)}
											className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-green-400 text-green-400 cursor-pointer"
										>
											{t('friends.addFriend')}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
				{searchError && <p className="text-[#e25f5f] mb-4">{searchError}</p>}
				{loadError && <p className="text-[#e25f5f] mb-4">{loadError}</p>}
				{friends.length === 0 && (
					<p className="text-[#8892a4]">{t('friends.noFriends')}</p>
				)}
				<div className="flex flex-col gap-3 w-full max-w-md">
					{friends.map(friend => (
						<div key={friend.id} className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-6 py-4 flex items-center justify-between">
							<div className="flex items-center gap-4">
								{friend.avatarUrl ? (
									<img src={friend.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
								) : (
									<div className="w-10 h-10 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] font-bold">
										{(friend.username || friend.email)[0].toUpperCase()}
									</div>
								)}
								<div>
									<p className="font-semibold">{friend.username || friend.email}</p>
									<p className="text-xs text-[#8892a4]">{friend.isOnline ? "🟢 " + t('friends.online') : "⚫ " + t('friends.offline')}</p>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => navigate(`/users/${friend.id}`)}
									className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-[#e2b96f] cursor-pointer"
								>
									{t('friends.viewProfile')}
								</button>
								<button
									onClick={() => handleRemove(friend.id)}
									className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-red-400 text-red-400 cursor-pointer"
								>
									{t('friends.remove')}
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default FriendsPage