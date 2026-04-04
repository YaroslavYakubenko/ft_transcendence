import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { getUserProfile, addFriend, removeFriend, type UserProfile } from "../api/social"
import { getUserStats, type UserStats } from "../api/game"
import { useTranslation } from "react-i18next"

function UserProfilePage() {
	const { id } = useParams()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [isFriend, setIsFriend] = useState(false)
	const [stats, setStats] = useState<UserStats | null>(null)
	const { t } = useTranslation()

	useEffect(() => {
		if (id) {
			getUserProfile(Number(id)).then(setProfile)
			getUserStats(Number(id)).then(setStats)
		}
	}, [id])

	if (!profile) return <div className="bg-[#0f0f13] min-h-screen text-[#f0eeff] flex items-center justify-center">{t('common.loading')}</div>

	function handleFriendToggle() {
		if (!profile) return
		if (isFriend) {
			removeFriend(profile.id)
			setIsFriend(false)
		} else {
			addFriend(profile.id)
			setIsFriend(true)
		}
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				<div className="w-20 h-20 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-3xl font-bold mb-4">
					{profile.username[0].toUpperCase()}
				</div>
				<p className="text-xl font-semibold mb-1">{profile.username}</p>
				<p className="text-sm text-[#8892a4] mb-8">{profile.email}</p>
				<div className="flex gap-4 mb-8">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-green-400">{profile.wins}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.wins')}</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-red-400">{profile.losses}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.losses')}</div>
					</div>
				</div>
				{stats && (
					<p className="text-[#e2b96f] text-lg font-semibold mb-8">{t('leaderboard.elo')}: {stats.elo}</p>
				)}
				<button
					onClick={handleFriendToggle}
					className="bg-[#1a1a24] border border-[#2e2e40] rounded-[10px] px-8 py-3 text-[#f0eeff] text-[15px] font-semibold cursor-pointer hover:border-[#e2b96f]"
				>
					{isFriend ? t('friends.removeFriend') : t('friends.addFriend')}
				</button>
			</div>
			<Footer />
		</div>
	)
}

export default UserProfilePage