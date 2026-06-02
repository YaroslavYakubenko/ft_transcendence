import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

import { useNavigate } from "react-router-dom"


import { DEFAULT_SETTINGS, type GameSettings } from "../chess/constants"
import { useLocation } from "react-router-dom"


function WaitingRoomPage() {

	const navigate = useNavigate()

	const location = useLocation()
	const settings: GameSettings = location.state ?? DEFAULT_SETTINGS


	function finish_connect() {
		console.debug(settings);
			navigate('/game', {
				state: {
					opponent: "bot",
					difficulty: settings.difficulty,
					timer: settings.timer,
					pieceColor: settings.pieceColor,
					userColor: settings.userColor,
					boardTheme: settings.boardTheme,
					pieceTheme: settings.pieceTheme,
					game_id: location.state.gameId,
				},
			})
		}


	return(
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />

			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex flex-col items-center gap-6 text-white">

					{/* Game ID */}
					<div className="flex flex-col items-center gap-2">
						<h1 className="text-2xl font-semibold">Game Id</h1>

						{/* placeholder */}
						<div className="px-4 py-2 bg-[#1a1a22] rounded-md text-gray-300">
							{/* replace this with your variable */}
							{settings.game_id}
						</div>
					</div>

					{/* Waiting text */}
					<div className="text-lg text-gray-400 animate-pulse">
						waiting for opponent ...
					</div>

					{/* Connect button */}
					<button
						onClick={finish_connect}
						className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md transition text-white font-medium"
					>
						Connect
					</button>

				</div>
			</div>

			<Footer />
		</div>
	)
}

export default WaitingRoomPage