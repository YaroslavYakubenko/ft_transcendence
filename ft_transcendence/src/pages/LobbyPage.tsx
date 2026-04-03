import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function LobbyPage() {
	const navigate = useNavigate()
	const [opponent, setOpponent] = useState<'bot' | 'live'>('bot')
	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
	const [timer, setTimer] = useState<'none' | '3' | '5' | '10'>('none')
	const [pieceColor, setPieceColor] = useState<'white' | 'black' | 'random'>('random')
	const [boardTheme, setBoardTheme] = useState<'default' | 'green' | 'blue' | 'brown'>('default')

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-md">
					<h1 className="text-[#f0eeff] text-xl font-semibold m-0 mb-6">Game Settings</h1>
					<div className="mb-6">
						<p className="text-[#8892a4] text-xs mb-2">Opponent</p>
						<div className="flex gap-2">
							{(['bot', 'live'] as const).map((opt) => (
								<button
									key={opt}
									onClick={() => setOpponent(opt)}
									className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${opponent === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
								>
									{opt === 'bot' ? 'Bot' : 'Live Player'}
								</button>
							))}
						</div>
					</div>
					{opponent === 'bot' && (
						<div className="mb-6">
								<p className="text-[#8892a4] text-xs mb-2">Difficulty</p>
								<div className="flex gap-2">
									{(['easy', 'medium', 'hard'] as const).map((opt) => (
										<button
											key={opt}
											onClick={() => setDifficulty(opt)}
											className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${difficulty === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
										>
											{opt.charAt(0).toUpperCase() + opt.slice(1)}
										</button>
									))}
								</div>
						</div>
					)}
					<div className="mb-6">
						<p className="text-[#8892a4] text-xs mb-2">Timer</p>
						<div className="flex gap-2">
							{([
								{ value: 'none', label: 'No timer' },
								{ value: '3', label: '3 min' },
								{ value: '5', label: '5+3' },
								{ value: '10', label: '10+5' },
							] as const).map((opt) => (
								<button
									key={opt.value}
									onClick={() => setTimer(opt.value)}
									className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer ${timer === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>
					<div className="mb-6">
							<p className="text-[#8892a4] text-xs mb-2">Play as</p>
							<div className="flex gap-2">
								{([
									{ value: 'white', label: '♚ White' },
									{ value: 'black', label: '♔ Black' },
									{ value: 'random', label: '🎲 Random' },
								] as const).map((opt) => (
									<button
										key={opt.value}
										onClick={() => setPieceColor(opt.value)}
										className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer ${pieceColor === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
									>
										{opt.label}
									</button>
								))}
							</div>
					</div>
					<div className="mb-6">
						<p className="text-[#8892a4] text-xs mb-2">Board Theme</p>
						<div className="flex gap-3">
								{([
									{ value: 'default', light: '#f0eeff', dark: '#2e2e40' },
									{ value: 'green', light: '#ffffdd', dark: '#86a666' },
									{ value: 'blue', light: '#dee3e6', dark: '#8ca2ad' },
									{ value: 'brown', light: '#f0d9b5', dark: '#b58863' },
								] as const).map((opt) => (
									<button
										key={opt.value}
										onClick={() => setBoardTheme(opt.value)}
										className={`w-10 h-10 rounded-lg border-2 cursor-pointer overflow-hidden p-0 ${boardTheme === opt.value ? 'border-[#e2b96f]' : 'border-transparent'}`}
									>
										<div className="w-full h-full grid grid-cols-2">
											<div style={{ backgroundColor: opt.light }} />
											<div style={{ backgroundColor: opt.dark }} />
											<div style={{ backgroundColor: opt.dark }} />
											<div style={{ backgroundColor: opt.light }} />
										</div>
									</button>
								))}
						</div>
					</div>
					<button
						onClick={() => navigate('/game', { state: { opponent, difficulty, timer, pieceColor, boardTheme } })}
						className="w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium cursor-pointer mt-2"
					>
						▶ Start Game
					</button>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default LobbyPage