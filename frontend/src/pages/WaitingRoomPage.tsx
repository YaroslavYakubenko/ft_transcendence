import { useEffect } from "react"

import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

import { useNavigate, useLocation } from "react-router-dom"


import { DEFAULT_SETTINGS, type GameSettings } from "../chess/constants"
import { useAuth } from "../context/AuthContext"


function WaitingRoomPage() {

	const navigate = useNavigate()

	const location = useLocation()
	const settings: GameSettings = location.state ?? DEFAULT_SETTINGS
	const { token } = useAuth()

	useEffect(() => {
		if (!settings.game_id || !token)
			return

		const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8443`
		const socket = new WebSocket(`${WS_URL}/ws/game/${settings.game_id}/?token=${token}`)

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data)
			if (data.msg_type === 'player_connected') {
				navigate('/game', {
					state: {
						opponent: "live",
						difficulty: settings.difficulty,
						timer: settings.timer,
						pieceColor: settings.pieceColor,
						userColor: settings.userColor,
						boardTheme: settings.boardTheme,
						pieceTheme: settings.pieceTheme,
						game_id: settings.game_id,
					},
				})
			}
		}
		return () => { socket.close() }
	}, [settings.game_id, token])

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex flex-col items-center gap-6 text-white">
					<div className="flex flex-col items-center gap-2">
						<h1 className="text-2xl font-semibold">Game ID</h1>
						<div className="px-4 py-2 bg-[#1a1a22] rounded-md text-gray-300">
							{settings.game_id}
						</div>
					</div>
					<div className="text-lg text-gray-400 animate-pulse">
						Waiting for opponent...
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default WaitingRoomPage