import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getUserStats, getMatchHistory } from "../api/game"
import type { UserStats, MatchRecord } from "../api/game"

function HomePage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const [stats, setStats] = useState<UserStats | null>(null)
	const [matches, setMatches] = useState<MatchRecord[]>([])

	useEffect(() => {
		if (!user) return
		getUserStats(user.id).then(setStats).catch(() => {})
		getMatchHistory(user.id).then((data) => setMatches(data.slice(0, 10))).catch(() => {})
	}, [user])

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-12 px-4 pb-12">
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
						<div className="text-2xl font-semibold text-green-400">{stats?.wins ?? 0}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.wins')}</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#e25f5f]">{stats?.losses ?? 0}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.losses')}</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#e2b96f]">#{stats?.rank ?? '-'}</div>
						<div className="text-xs text-[#8892a4] mt-1">{t('home.rank')}</div>
					</div>
				</div>

				<div className="w-full max-w-2xl mb-8">
					<h2 className="text-lg font-semibold mb-4 text-[#f0eeff]">{t('profile.matchHistory')}</h2>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl overflow-hidden">
						{matches.length === 0 ? (
							<p className="text-[#8892a4] text-sm px-6 py-4">{t('profile.noMatches')}</p>
						) : (
							<table className="w-full">
								<thead>
									<tr className="border-b border-[#2e2e40] text-[#8892a4] text-sm">
										<th className="text-left px-6 py-3">{t('profile.result')}</th>
										<th className="text-left px-6 py-3">{t('profile.opponent')}</th>
										<th className="text-left px-6 py-3">{t('profile.duration')}</th>
										<th className="text-left px-6 py-3">{t('profile.date')}</th>
									</tr>
								</thead>
								<tbody>
									{matches.map((match) => (
										<tr key={match.id} className="border-b border-[#2e2e40] last:border-0">
											<td className="px-6 py-3">
												<span className={
													match.result === 'win' ? 'text-green-400 font-semibold' :
													match.result === 'loss' ? 'text-[#e25f5f] font-semibold' :
													'text-[#8892a4] font-semibold'
												}>
													{t(`profile.${match.result}`).toUpperCase()}
												</span>
											</td>
											<td className="px-6 py-3">{match.opponent_name}</td>
											<td className="px-6 py-3 text-[#8892a4]">{match.duration}</td>
											<td className="px-6 py-3 text-[#8892a4]">{match.date}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
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
