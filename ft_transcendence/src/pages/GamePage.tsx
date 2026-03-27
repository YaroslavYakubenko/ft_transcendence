import { useState } from "react"
import { Chessboard } from "react-chessboard"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function GamePage() {
	const [fen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 py-8">
				<h1 className="text-[#f0eeff] text-2xl font-bold mb-6">Chess</h1>
				<div className="w-full max-w-[500px]">
					<Chessboard
						options={{
							position: fen,
							darkSquareStyle: { backgroundColor: "#2e2e40" },
							lightSquareStyle: { backgroundColor: "#f0eeff" },
							onPieceDrop: ({ sourceSquare, targetSquare }) => {
								console.log(`Move: ${sourceSquare} → ${targetSquare}`)
								return false
							},
						}}
					/>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default GamePage