import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { getLeaderboard } from "../api/game"
import { useTranslation } from "react-i18next"

type LeaderboardEntry = {
	id: number
	username: string
	wins: number
	losses: number
	draws: number
	elo: number
	rank: number
}

function LeaderboardPage() {
	const [players, setPlayers] = useState<LeaderboardEntry[]>([])
	const navigate = useNavigate()
	const { t } = useTranslation()

	useEffect(() => {
		const fetch = () => getLeaderboard().then(setPlayers).catch(() => {})

		// initial load
		fetch()

		// refetch when page becomes visible or window gains focus
		const onFocus = () => fetch()
		const onVisibility = () => {
			if (document.visibilityState === 'visible') fetch()
		}

		window.addEventListener('focus', onFocus)
		document.addEventListener('visibilitychange', onVisibility)

		return () => {
			window.removeEventListener('focus', onFocus)
			document.removeEventListener('visibilitychange', onVisibility)
		}
	}, [])

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-12 px-4">
				<h1 className="text-2xl font-bold mb-8">{t('leaderboard.title')}</h1>
				<p className="text-sm text-[#8892a4] mb-6">Select player to view profile detail / add as friend.</p>
				<div className="w-full max-w-2xl bg-[#1a1a24] border border-[#2e2e40] rounded-xl overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="border-b border-[#2e2e40] text-[#8892a4] text-sm">
								<th className="text-left px-6 py-4">{t('leaderboard.rank')}</th>
								<th className="text-left px-6 py-4">{t('leaderboard.player')}</th>
								<th className="text-left px-6 py-4">{t('leaderboard.wins')}</th>
								<th className="text-left px-6 py-4">{t('leaderboard.draws')}</th>
								<th className="text-left px-6 py-4">{t('leaderboard.losses')}</th>
								<th className="text-left px-6 py-4">{t('leaderboard.elo')}</th>
							</tr>
						</thead>
						<tbody>
							{players.map((player) => (
								<tr
									key={player.id}
									className="border-b border-[#2e2e40] last:border-0 hover:bg-[#22223a] cursor-pointer"
									onClick={() => navigate(`/users/${player.id}`)}
								>
									<td className="px-6 py-4 text-[#e2b96f] font-semibold">{player.rank}</td>
									<td className="px-6 py-4">{player.username}</td>
									<td className="px-6 py-4 text-green-400">{player.wins}</td>
									<td className="px-6 py-4 text-[#8892a4]">{player.draws}</td>
									<td className="px-6 py-4 text-[#e25f5f]">{player.losses}</td>
									<td className="px-6 py-4 text-[#8892a4]">{player.elo}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default LeaderboardPage