import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"

function HomePage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const stats = { wins: 0, losses: 0, rank: '-' }
	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				{user && (
					<p className="text-[#8892a4] text-sm mb-8 m-0">
						Welcome, {user.email}
					</p>
				)}
				<div className="flex gap-4 mb-8">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.wins}</div>
						<div className="text-xs text-[#8892a4] mt-1">Wins</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.losses}</div>
						<div className="text-xs text-[#8892a4] mt-1">Losses</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold text-[#f0eeff]">{stats.rank}</div>
						<div className="text-xs text-[#8892a4] mt-1">Rank</div>
					</div>
				</div>
				<button
				onClick={() => navigate('/game')}
					className="bg-[#e2b96f] border-none rounded-[10px] px-10 py-3 text-[#0f0f13] text-[15px] font-semibold cursor-pointer"
				>
					▶ Play
				</button>
			</div>
			<Footer />
		</div>
	)
}

export default HomePage
