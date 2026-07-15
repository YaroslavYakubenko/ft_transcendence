import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import i18n from "../i18n"

const LANGUAGES = [
	{ code: "en", label: "EN" },
	{ code: "de", label: "DE" },
	{ code: "ru", label: "RU" },
	{ code: "ar", label: "AR" },
]

function Navbar() {
	const {logout, isLoggedIn} = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()
	const [langOpen, setLangOpen] = useState(false)
	const [hasActiveGame, setHasActiveGame] = useState(false)

	useEffect(() => {
		const check = () => {
			const saved = localStorage.getItem('game_session')
			setHasActiveGame(!!saved)
		}
		check()
		window.addEventListener('storage', check)
		return () => window.removeEventListener('storage', check)
	}, [location.pathname])

	function handleLogout() {
		logout()
		navigate('/login')
	}

	function handleLanguageChange(code: string) {
		i18n.changeLanguage(code)
		localStorage.setItem("language", code)
		document.documentElement.dir = code === "ar" ? "rtl" : "ltr"
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
							{t("nav.home")}
						</NavLink>
						<NavLink to="/lobby" className={({ isActive }) => isActive || location.pathname === '/game' ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							{t("nav.game")}
						</NavLink>
						{hasActiveGame && location.pathname !== '/game' && (
							<NavLink to="/game" className="text-[#6ee27a] text-[13px] no-underline animate-pulse">
								↩ Resume
							</NavLink>
						)}
						<NavLink to="/profile" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							{t("nav.profile")}
						</NavLink>
						<NavLink to="/friends" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							{t("nav.friends")}
						</NavLink>
						<NavLink to="/leaderboard" className={({ isActive }) => isActive ? "text-[#e2b96f] text-[13px] no-underline" : "text-[#8892a4] text-[13px] no-underline"}>
							{t("nav.leaderboard")}
						</NavLink>

					</>
				)}

				<div className="relative">
					<button
						onClick={() => setLangOpen(!langOpen)}
						className="px-2 py-1 text-[12px] rounded cursor-pointer border border-[#2e2e40] bg-transparent text-[#8892a4] hover:border-[#e2b96f]"
					>
						{i18n.language.toUpperCase()} ▾
					</button>
					{langOpen && (
						<div className="absolute top-[calc(100%+8px)] right-0 rtl:right-auto rtl:left-0 bg-[#1a1a24] border border-[#2e2e40] rounded-lg overflow-hidden z-[100]">
							{LANGUAGES.map((lang) => (
								<button
									key={lang.code}
									onClick={() => { handleLanguageChange(lang.code); setLangOpen(false) }}
									className={`px-2 py-1 text-[12px] rounded cursor-pointer border-none bg-transparent ${i18n.language === lang.code ? "text-[#e2b96f]" : "text-[#8892a4]"}`}
								>
									{lang.label}
								</button>
							))}
						</div>
					)}
				</div>

				{isLoggedIn ? (
					<button
						onClick={handleLogout}
						className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] cursor-pointer hover:border-[#e2b96f]"
					>
						{t("nav.logout")}
					</button>
				) : location.pathname === '/login' ? (
					<Link to="/register" className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] no-underline hover:border-[#e2b96f]">
						{t('register.submit')}
					</Link>
				) : (
					<Link to="/login" className="bg-transparent border border-[#2e2e40] rounded-lg px-3 py-1.5 text-[#8892a4] text-[13px] no-underline hover:border-[#e2b96f]">
						{t('login.submit')}
					</Link>
				)}
			</div>
		</nav>
	)
}

export default Navbar