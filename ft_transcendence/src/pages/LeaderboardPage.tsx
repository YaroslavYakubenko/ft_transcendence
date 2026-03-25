import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function LeaderboardPage() {
	const players = [
		{ id: 1, email: "alice@mail.com", wins: 42, losses: 5 },                                                                                        
        { id: 2, email: "bob@mail.com", wins: 35, losses: 12 },
        { id: 3, email: "carol@mail.com", wins: 28, losses: 8 },                                                                                        
        { id: 4, email: "dave@mail.com", wins: 21, losses: 20 },
        { id: 5, email: "eve@mail.com", wins: 15, losses: 30 },
	]
	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-12 px-4">
				<h1 className="text-2xl font-bold mb-8">Leaderboard</h1>
				<div className="w-full max-w-2xl bg-[#1a1a24] border border-[#2e2e40] rounded-xl overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="border-b border-[#2e2e40] text-[#8892a4] text-sm">
								<th className="text-left px-6 py-4">#</th>
								<th className="text-left px-6 py-4">Player</th>
								<th className="text-left px-6 py-4">Wins</th>
								<th className="text-left px-6 py-4">Losses</th>
							</tr>
						</thead>
						<tbody>
							{players.map((player, index) => (
								<tr key={player.id} className="border-b border-[#2e2e40] last:border-0 hover:bg-[#22223a]">
									<td className="px-6 py-4 text-[#e2b96f] font-semibold">{index + 1}</td>
									<td className="px-6 py-4">{player.email}</td>
									<td className="px-6 py-4 text-green-400">{player.wins}</td>
									<td className="px-6 py-4 text-[#e25f5f]">{player.losses}</td>
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