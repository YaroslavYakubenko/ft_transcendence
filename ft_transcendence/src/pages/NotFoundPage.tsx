import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function NotFoundPage() {
	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				<div className="text-[96px] font-bold text-[#e2b96f] leading-none">
					404
				</div>
				<p className="text-[#8892a4] text-sm mt-4 mb-8">
					This page doesn't exist.
				</p>
				<Link
					to="/"
					className="bg-[#e2b96f] text-[#0f0f13] rounded-[10px] px-10 py-3 text-[15px] font-semibold no-underline"
				>
					← Back to Home
				</Link>
			</div>
			<Footer />
		</div>
	)
}

export default NotFoundPage
