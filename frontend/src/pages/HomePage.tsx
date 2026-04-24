import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

function HomePage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const stats = { wins: 0, losses: 0, rank: '-' }
	const { t } = useTranslation()

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				{user?.avatarUrl ? (
					<img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover mb-4" />
				) : (
					<div className="w-20 h-20 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-3xl font-bold mb-4">
						{(user?.username || user?.email || '?')[0].toUpperCase()}
					</div>
				)}
				{user && (
					<p className="text-[#8892a4] text-sm mb-8 m-0">
						{t('home.welcome')}, {user.username || user.email}
					</p>
				)}
				<div className="flex gap-4 mb-8">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.wins}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.wins')}</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.losses}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.losses')}</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.rank}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.rank')}</div>
					</div>
				</div>
				<button
				onClick={() => navigate('/lobby')}
					className="bg-[#e2b96f] border-none rounded-[10px] px-10 py-3 text-[#0f0f13] text-[15px] font-semibold cursor-pointer"
				>
					▶ {t('home.playNow')}
				</button>
			</div>
			<Footer />
		</div>
	)
}

export default HomePage
