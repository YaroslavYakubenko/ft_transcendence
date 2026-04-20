import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"

function Footer() {
	const { t} = useTranslation()

	return (
		<footer className="border-t border-[#2e2e40] py-4 flex justify-center gap-6">
			<span className="text-[#8892a4] text-xs">© 2026 ft_transcendence</span>
			<NavLink to="/privacy-policy" className={({ isActive }) => isActive ? "text-[#e2b96f] text-xs no-underline" : "text-[#8892a4] text-xs no-underline"}>
				{t('footer.privacyPolicy')}
			</NavLink>
			<NavLink to="/terms-of-service" className={({ isActive }) => isActive ? "text-[#e2b96f] text-xs no-underline" : "text-[#8892a4] text-xs no-underline"}>
				{t('footer.termsOfService')}
			</NavLink>
		</footer>
	)
}

export default Footer