import { useState } from "react"
import { Chessboard } from "react-chessboard"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function GamePage() {
	const [fen] = useState("start")

	function onDrop(sourceSquare: string, targetSquare: string) {
		//TODO: send a move to backend through WebSocket
		//ws.send(JSON.stringfy({ fom: sourceSquare, to: targetSquare }))
		console.log(`Move: ${sourceSquare} → ${targetSquare}`)
		return false //backend is deciding to take a move
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 py-8">
				<h1 className="text-[#f0eeff] text-2xl font-bold mb-6">Chess</h1>
				<div className="w-full max-w-[500px]">
					<Chessboard
						position={fen}
						onPieceDrop={onDrop}
						boardWidth={500}
						customDarkSquareStyle={{ backgroundColor: "#2e2e40" }}
						customLightSquareStyle={{ backgroundColor: "#f0eeff" }}
					/>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default GamePage