import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"

function ProfilePage() {
	const { user } = useAuth()
	const navigate = useNavigate()

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				<div className="w-20 h-20 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-3xl font-bold mb-4">
					{user ? user.email[0].toUpperCase() : '?'}
				</div>
				<p className="text-xl font-semibold mb-1">{user?.email}</p>
				<p className="text-sm text-[#8892a4] mb-8">Member</p>
				<div className="flex gap-4">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold">0</div>
						<div className="text-xs text-[#8892a4] mt-1">Wins</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold">0</div>
						<div className="text-xs text-[#8892a4] mt-1">Losses</div>
					</div>
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-8 py-6 text-center">
						<div className="text-2xl font-semibold">-</div>
						<div className="text-xs text-[#8892a4] mt-1">Rank</div>
					</div>
				</div>
				<button
					onClick={() => navigate('/profile/edit')}
					className="mt-8 bg-[#1a1a24] border border-[#2e2e40] rounded-[10px] px-8 py-3 text-[#f0eeff] text-[15px] font-semibold cursor-pointer hover:border-[#e2b96f]"
				>
					Edit Profile
				</button>
			</div>
			<Footer />
		</div>
	)
}

export default ProfilePage