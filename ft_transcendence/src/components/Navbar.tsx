import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Navbar() {
	const {logout, isLoggedIn} = useAuth()
	const navigate = useNavigate()
	function handleLogout() {
		logout()
		navigate('/login')
	}

	return (
		<nav className="bg-[#1a1a24] border-b border-[#2e2e40] px-6 h-[52px] flex items-center justify-between">
			<Link to="/home" className="text-[#f0eeff] text-[15px] font-medium no-underline">
				ft_transcendence
			</Link>
			<div className="flex items-center gap-6">
				{isLoggedIn && (
					<>
						<Link to="/profile" className="text-[#8892a4] text-[13px] no-underline">
							Profile
						</Link>
						<Link to="/leaderboard" className="text-[#8892a4] text-[13px] no-underline">
							Leaderboard
						</Link>
					</>
				)}
				{isLoggedIn ? (
					<button
						onClick={handleLogout}
						className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] cursor-pointer"
					>
						Logout
					</button>
				) : (
					<Link to="/login" className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] no-underline">
						Login
					</Link>
				)}
			</div>
		</nav>
	)
}

export default Navbar