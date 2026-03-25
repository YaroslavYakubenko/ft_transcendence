import { Link } from "react-router-dom"

function Footer() {

	return (
		<footer className="border-t border-[#2e2e40] py-4 flex justify-center gap-6">
			<Link to="/privacy-policy" className="text-[#8892a4] text-xs no-underline">
				Privacy Policy
			</Link>
			<Link to="/terms-of-service" className="text-[#8892a4] text-xs no-underline">
				Terms of Service
			</Link>
		</footer>
	)
}

export default Footer