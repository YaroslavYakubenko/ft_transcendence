import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { getFriends, removeFriend, type Friend } from "../api/social"
import { useTranslation } from "react-i18next"
import { useToast } from "../context/ToastContext"

function FriendsPage() {
	const [friends, setFriends] = useState<Friend[]>([])
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { token } = useAuth()
	const { showToast } = useToast()

	useEffect(() => {
		const controller = new AbortController()
		getFriends(token!, controller.signal).then(setFriends).catch((err) => {
			if (err.name !== 'AbortError') setError(t('friends.fetchFailed'))
		})
		return () => controller.abort()
	}, [])

	async function handleRemove(userId: number) {
		try {
			await removeFriend(userId, token!)
			setFriends(friends.filter(f => f.id !== userId))
			showToast(t('toast.friendRemoved'))
		} catch {
			showToast(t('toast.friendRemoveFailed'), 'error')
		}
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-16 px-4">
				<h1 className="text-2xl font-bold mb-8">{t('friends.title')}</h1>
				{error && <p className="text-[#e25f5f] mb-4">{error}</p>}
				{friends.length === 0 && (
					<p className="text-[#8892a4]">{t('friends.noFriends')}</p>
				)}
				<div className="flex flex-col gap-3 w-full max-w-md">
					{friends.map(friend => (
						<div key={friend.id} className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-6 py-4 flex items-center justify-between">
							<div className="flex items-center gap-4 min-w-0">
								{friend.avatarUrl ? (
									<img src={friend.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
								) : (
									<div className="w-10 h-10 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] font-bold flex-shrink-0">
										{(friend.username || friend.email.split('@')[0])[0].toUpperCase()}
									</div>
								)}
								<div className="min-w-0">
									<p className="font-semibold truncate">{friend.username || friend.email.split('@')[0]}</p>
									<p className="text-xs text-[#8892a4]">{friend.isOnline ? "🟢 " + t('friends.online') : "⚫ " + t('friends.offline')}</p>
								</div>
							</div>
							<div className="flex gap-2 flex-shrink-0">
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