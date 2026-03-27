import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { getFriends, removeFriend, type Friend } from "../api/social"

function FriendsPage() {
	const [friends, setFriends] = useState<Friend[]>([])
	const navigate = useNavigate()

	useEffect(() => {
		getFriends().then(setFriends)
	}, [])

	function handleRemove(userId: number) {
		removeFriend(userId)
		setFriends(friends.filter(f => f.id !== userId))
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center flex-1 text-[#f0eeff] pt-16 px-4">
				<h1 className="text-2xl font-bold mb-8">Friends</h1>
				{friends.length === 0 && (
					<p className="text-[#8892a4]">You have no friends yet.</p>
				)}
				<div className="flex flex-col gap-3 w-full max-w-md">
					{friends.map(friend => (
						<div key={friend.id} className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-6 py-4 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] font-bold">
									{friend.username[0].toUpperCase()}
								</div>
								<div>
									<p className="font-semibold">{friend.username}</p>
									<p className="text-xs text-[#8892a4]">{friend.isOnline ? "🟢 Online" : "⚫ Offline"}</p>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => navigate(`/users/${friend.id}`)}
									className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-[#e2b96f] cursor-pointer"
								>
									Profile
								</button>
								<button
									onClick={() => handleRemove(friend.id)}
									className="text-sm px-3 py-1 border border-[#2e2e40] rounded-lg hover:border-red-400 text-red-400 cursor-pointer"
								>
									Remove
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