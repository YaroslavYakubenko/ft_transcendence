import { Link, NavLink, useNavigate } from "react-router-dom"
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
						<NavLink to="/home" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							Home
						</NavLink>
						<NavLink to="/lobby" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							Game
						</NavLink>
						<NavLink to="/profile" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							Profile
						</NavLink>
						<NavLink to="/friends" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							Friends
						</NavLink>
						<NavLink to="/leaderboard" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							Leaderboard
						</NavLink>

					</>
				)}
				{isLoggedIn ? (
					<button
						onClick={handleLogout}
						className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] cursor-pointer hover:border-[#e2b96f]"
					>
						Logout
					</button>
				) : (
					<Link to="/login" className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] no-underline hover:border-[#e2b96f]">
						Login
					</Link>
				)}
			</div>
		</nav>
	)
}

export default Navbar