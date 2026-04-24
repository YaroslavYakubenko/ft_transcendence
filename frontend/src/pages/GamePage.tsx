import { useState} from 'react';
import { Chessboard } from "react-chessboard";

async function make_move(fen: string, from: string, to: string) {
  const res = await fetch("http://localhost:8000/make-move/", {
	method: "POST",
	headers: {
	  "Content-Type": "application/json",
	},
	body: JSON.stringify({
	  fen,
	  from,
	  to,
	}),
  });

  const data = await res.json();

  if (data.error) {
	console.error(data.error);
	return null; // fallback: no update
  }

  return data;
}

function GamePage() {

	const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
	const [result, setRes] = useState<string>("ongoing")
	const chessboardOptions =
	{
		// your config options here
		position: fen,
		onPieceDrop: ({ sourceSquare, targetSquare }) => {
			if (!sourceSquare || !targetSquare) return false;

			make_move(fen, sourceSquare, targetSquare).then((data) => {
				if (!data) 
					return;

				setFen(data.fen);
				setRes(data.result);
	   		});

		  return false; // prevent local move, backend is source of truth
		},
	};

	return (
		<div style={{ position: "relative" }}>
		
			<Chessboard options={chessboardOptions} />

	{result !== "ongoing" && (
		<div style={{
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: "rgba(0,0,0,0.6)",
			color: "white",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			fontSize: "32px",
			fontWeight: "bold"
		}}>
			Game Over: {result}
		</div>
	)}
	</div>
	);
}

export default GamePage








// import { useState } from "react"
// import { useLocation } from "react-router-dom"
// import { Chessboard } from "react-chessboard"
// import { useAuth } from "../context/AuthContext"
// import Navbar from "../components/Navbar"
// import Footer from "../components/Footer"
// import { useTranslation } from "react-i18next"

// interface GameSettings {
// 	opponent: 'bot' | 'live'
// 	difficulty: 'easy' | 'medium' | 'hard'
// 	timer: 'none' | '3' | '5' | '10'
// 	pieceColor: 'white' | 'black' | 'random'
// 	boardTheme: 'default' | 'green' | 'blue' | 'brown'
// }

// const BOARD_THEMES = {
// 	default: { light: '#f0eeff', dark: '#2e2e40' },
// 	green: { light: '#ffffdd', dark: '#86a666' },
// 	blue: { light: '#dee3e6', dark: '#8ca2ad' },
// 	brown: { light: '#f0d9b5', dark: '#b58863' },
// }

// function GamePage() {
// 	const { user } = useAuth()
// 	const location = useLocation()
// 	const settings: GameSettings = location.state ?? {
// 		opponent: 'bot',
// 		difficulty: 'medium',
// 		timer: 'none',
// 		pieceColor: 'random',
// 		boardTheme: 'default'
// 	}
// 	const theme = BOARD_THEMES[settings.boardTheme]
// 	const [fen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
// 	const [moves] = useState<string[]>([])
// 	const { t } = useTranslation()

// 	return (
// 		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
// 			<Navbar />
// 			<div className="flex-1 flex items-center justify-center py-8">
// 				<div className="flex gap-4 items-start">

// 					{/* Left - board + player pannels */}
// 					<div className="flex flex-col">

// 						{/* Opponent panel */}
// 						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 flex mt-2 items-center justify-between w-[500px]">
// 							<div className="flex items-center gap-3">
// 								<div className="w-8 h-8 rounded-full bg-[#3d3d55] border border-[#5a5a7a] flex items-center justify-center text-[#f0eeff] text-xs font-bold">
// 									{settings.opponent == 'bot' ? 'AI' : '?'}
// 								</div>
// 								<span className="text-[#f0eeff] text-sm font-medium">
// 									{settings.opponent === 'bot' ? `${t('lobby.bot')} (${t(`lobby.${settings.difficulty}`)})` : t('lobby.opponent')}
// 								</span>
// 							</div>
// 							<span className="text-[#e2b96f] text-sm font-mono">
// 								{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
// 							</span>
// 						</div>

// 						{/* Board */}
// 						<div className="w-[500px]">
// 							<Chessboard
// 								options={{
// 									position: fen,
// 									darkSquareStyle: { backgroundColor: theme.dark },
// 									lightSquareStyle: { backgroundColor: theme.light },
// 									onPieceDrop: ({ sourceSquare: _s, targetSquare: _t }) => {
// 										return false
// 									},
// 								}}
// 							/>
// 						</div>

// 						{/* Player panel */}
// 						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 mt-2 flex items-center justify-between w-[500px]">
// 								<div className="flex items-center gap-3">
// 									<div className="w-8 h-8 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-xs font-bold">
// 										{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
// 									</div>
// 									<span className="text-[#f0eeff] text-sm font-medium">
// 										{user?.username || user?.email || 'You'}
// 									</span>
// 								</div>
// 								<span className="text-[#e2b96f] text-sm font-mono">
// 									{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
// 								</span>
// 						</div>
// 					</div>

// 					{/* Right - move history + buttons */}
// 					<div className="flex flex-col gap-3 w-48">
// 						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 flex-1">
// 							<p className="text-[#8896a4] text-xs mb-2 m-0">{t('game.movesHistory')}</p>
// 							{moves.length === 0 ? (
// 								<p className="text-[#2e2e40] text-xs">{t('game.noMoves')}</p>
// 							) : (
// 								<div className="text-[#f0eeff] text-xs space-y-1">
// 									{moves.map((move, i) => (
// 										<span key={i} className="block">{move}</span>
// 									))}
// 								</div>
// 							)}
// 						</div>
// 						<button className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]">
// 							{t('game.resign')}
// 						</button>
// 						<button className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f]">
// 							{t('game.draw')}
// 						</button>
// 					</div>
// 				</div>
// 			</div>
// 			<Footer />
// 		</div>
// 	)
// }

// export default GamePage