import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { createGame } from "../api/game"

function LobbyPage() {
	const navigate = useNavigate()
	const { token } = useAuth()
	const [opponent, setOpponent] = useState<'bot' | 'live'>('bot')
	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
	const [timer, setTimer] = useState<'none' | '3' | '5' | '10'>('none')
	const [pieceColor, setPieceColor] = useState<'white' | 'black' | 'random'>('random')
	const [boardTheme, setBoardTheme] = useState<'default' | 'green' | 'blue' | 'brown'>('default')
	const [pieceTheme, setPieceTheme] = useState<'default' | 'simple'>('default')
	const [isStarting, setIsStarting] = useState(false)
	const [startError, setStartError] = useState("")
	const [joinGameId, setJoinGameId] = useState("")
	const { t } = useTranslation()

    // Player 2 — join an existing game by ID
    function handleJoinGame() {
        if (!joinGameId.trim()) return
        const id = parseInt(joinGameId)
        // Clear stale cached game state so we start fresh
        localStorage.removeItem(`result_${id}`)
        localStorage.removeItem(`chess_fen_${id}`)
        localStorage.removeItem(`move_history_${id}`)
        localStorage.removeItem(`piece_color_${id}`)
        navigate('/game', {
            state: {
                opponent: 'live',
                difficulty,
                timer,
                pieceColor,
                boardTheme,
                pieceTheme,
                game_id: id,
            },
        })
    }

    // Player 1 — create a new game
    const handleStartGame = async () => {
		setStartError("")
        setIsStarting(true)

        let gameId: number | undefined
        let userColor = pieceColor

        if (opponent === 'bot' && token) {
            const game = await createGame(opponent, pieceColor, token, timer)

            if (game?.game_id) {
                gameId = game.game_id
            } else {
                setStartError(t('lobby.couldNotCreateTracked'))
            }

            if (game?.user && game.user !== pieceColor) {
                userColor = game.user
                setPieceColor(game.user)
            }
        }

        if (opponent === 'live' && token) {
            const game = await createGame("live", pieceColor, token, timer)

            if (game?.game_id) {
                gameId = game.game_id
                localStorage.removeItem(`result_${game.game_id}`)
                localStorage.removeItem(`chess_fen_${game.game_id}`)
                localStorage.removeItem(`move_history_${game.game_id}`)
                localStorage.removeItem(`piece_color_${game.game_id}`)
            } else {
                setStartError(t('lobby.couldNotCreate'))
            }

            if (game?.user && game.user !== pieceColor) {
                userColor = game.user
                setPieceColor(game.user)
            }

            setIsStarting(false)
            navigate('/waiting_room', {
                state: {
                    opponent,
                    difficulty,
                    timer,
                    pieceColor,
                    userColor,
                    boardTheme,
                    pieceTheme,
                    game_id: gameId,
                },
            })
            return
        }

        setIsStarting(false)
        navigate('/game', {
            state: {
                opponent,
                difficulty,
                timer,
                pieceColor,
                userColor,
                boardTheme,
                pieceTheme,
                game_id: gameId,
            },
        })
    }

    return (
        <div className="bg-[#0f0f13] min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-md">
                    <h1 className="text-[#f0eeff] text-xl font-semibold m-0 mb-6">{t('lobby.title')}</h1>

                    {/* opponent */}
                    <div className="mb-6">
                        <p className="text-[#8892a4] text-xs mb-2">{t('lobby.opponent')}</p>
                        <div className="flex gap-2">
                            {(['bot', 'live'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setOpponent(opt)}
                                    className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${opponent === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
                                >
                                    {opt === 'bot' ? t('lobby.bot') : t('lobby.live')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bot difficulty */}
                    {opponent === 'bot' && (
                        <div className="mb-6">
                            <p className="text-[#8892a4] text-xs mb-2">{t('lobby.difficulty')}</p>
                            <div className="flex gap-2">
                                {(['easy', 'medium', 'hard'] as const).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setDifficulty(opt)}
                                        className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${difficulty === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
                                    >
                                        {t(`lobby.${opt}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* timer */}
                    <div className="mb-6">
                        <p className="text-[#8892a4] text-xs mb-2">{t('lobby.timer')}</p>
                        <div className="flex gap-2">
                            {([
                                { value: 'none', label: t('lobby.noTimer') },
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

                    {/* piece color */}
                    <div className="mb-6">
                        <p className="text-[#8892a4] text-xs mb-2">{t('lobby.pieceColor')}</p>
                        <div className="flex gap-2">
                            {([
                                { value: 'white', label: `♚ ${t('lobby.white')}` },
                                { value: 'black', label: `♔ ${t('lobby.black')}` },
                                { value: 'random', label: `🎲 ${t('lobby.random')}` },
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

                    {/* Board theme */}
                    <div className="mb-6">
                        <p className="text-[#8892a4] text-xs mb-2">{t('lobby.boardTheme')}</p>
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

					{/* piece theme */}
					<div className="mb-6">
						<p className="text-[#8892a4] text-xs mb-2">{t('lobby.pieceTheme')}</p>
						<div className="flex gap-3">
								{([
									{ value: 'default', label: <img src="/imgs/Chess_klt45.svg.png" className="w-12 h-12 object-contain"/> },
									{ value: 'simple', label: <img src="/imgs/wk.png" className="w-12 h-12 object-contain"/> },
								] as const).map((opt) => (
									<button
										key={opt.value}
										onClick={() => setPieceTheme(opt.value)}
										className={`w-14 h-14 flex items-center justify-center rounded-lg border cursor-pointer text-sm ${pieceTheme === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
									>
										{opt.label}
									</button>
								))}
						</div>
					</div>

                    {/* Start game */}
                    <button
                        onClick={handleStartGame}
                        disabled={isStarting}
                        className="w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium cursor-pointer mt-2"
                    >
                        ▶ {isStarting ? 'Starting...' : t('lobby.startGame')}
                    </button>

                    {startError && <p className="text-[#e25f5f] text-xs mt-2 mb-0">{startError}</p>}

                    {/* Join existing game — only shown when live is selected */}
                    {opponent === 'live' && (
                        <div className="mt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 h-px bg-[#2e2e40]" />
                                <span className="text-[#8892a4] text-xs">or join existing game</span>
                                <div className="flex-1 h-px bg-[#2e2e40]" />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={joinGameId}
                                    onChange={e => setJoinGameId(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleJoinGame()}
                                    placeholder="Enter game ID"
                                    className="flex-1 bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2 text-sm text-[#f0eeff] outline-none"
                                />
                                <button
                                    onClick={handleJoinGame}
                                    className="bg-[#0f0f13] text-[#f0eeff] border border-[#2e2e40] rounded-lg px-4 py-2 text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f]"
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            <Footer />
        </div>
    )
}

export default LobbyPage


// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import Navbar from "../components/Navbar"
// import Footer from "../components/Footer"
// import { useTranslation } from "react-i18next"
// import { useAuth } from "../context/AuthContext"
// import { createGame } from "../api/game"

// function LobbyPage() {
// 	const navigate = useNavigate()
// 	const { token } = useAuth()
// 	const [opponent, setOpponent] = useState<'bot' | 'live'>('bot')
// 	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
// 	const [timer, setTimer] = useState<'none' | '3' | '5' | '10'>('none')
// 	const [pieceColor, setPieceColor] = useState<'white' | 'black' | 'random'>('random')
// 	const [boardTheme, setBoardTheme] = useState<'default' | 'green' | 'blue' | 'brown'>('default')
// 	const [pieceTheme, setPieceTheme] = useState<'default' | 'simple'>('default')
// 	const [isStarting, setIsStarting] = useState(false)
// 	const [startError, setStartError] = useState("")
// 	const { t } = useTranslation()

// 	const handleStartGame = async () => {
// 		setStartError("")
// 		setIsStarting(true)
		
// 		let gameId: number | undefined
// 		let userColor = pieceColor

// 		// Keep previous UX: start game even if backend game creation is unavailable.
// 		if (opponent === 'bot' && token) {

// 			console.debug("lobby handle start game1 | pieceColor: ", pieceColor)

// 			const game = await createGame(opponent, pieceColor, token)
			
// 			console.debug("lobby handle start game2 | game.user: ", game.user)

// 			if (game?.game_id) {
// 				gameId = game.game_id
// 			} else {
// 				setStartError("Could not create tracked game. Starting local game without stats/resign tracking.")
// 			}

// 			if (game.user !== pieceColor) // this updates from random to site, maybe keep
// 			{
// 				userColor = game.user
// 				setPieceColor(game.user)
// 			}
// 			console.debug("lobby handle start game3 | userColor: ", userColor)
// 		}
// 		// check here for live player 
// 		// instead of navigating to /game go to a diffrent one to wait for opponent 

// 		if (opponent === 'live' && token)
// 		{
// 			console.log("here")
// 			const game = await createGame("bot", pieceColor, token)

// 			if (game?.game_id) {
// 				gameId = game.game_id
// 			} else {
// 				setStartError("Could not create tracked game. Starting local game without stats/resign tracking.")
// 			}

// 			if (game.user !== pieceColor) // this updates from random to site, maybe keep
// 			{
// 				userColor = game.user
// 				setPieceColor(game.user)
// 			}

// 			setIsStarting(false)
// 			navigate('/waiting_room', {
// 				state: {
// 					opponent,
// 					difficulty,
// 					timer,
// 					pieceColor,
// 					userColor,
// 					boardTheme,
// 					pieceTheme,
// 					game_id: gameId,
// 				},
// 			})

// 		}
// 		else
// 		{
// 			setIsStarting(false)
// 			navigate('/game', {
// 				state: {
// 					opponent,
// 					difficulty,
// 					timer,
// 					pieceColor,
// 					userColor,
// 					boardTheme,
// 					pieceTheme,
// 					game_id: gameId,
// 				},
// 			})
// 		}
// 	}

// 	return (
// 		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
// 			<Navbar />
// 			<div className="flex-1 flex items-center justify-center py-8">
// 				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-md">
// 					<h1 className="text-[#f0eeff] text-xl font-semibold m-0 mb-6">{t('lobby.title')}</h1>
					
// 					{/* opponent */}
// 					<div className="mb-6">
// 						<p className="text-[#8892a4] text-xs mb-2">{t('lobby.opponent')}</p>
// 						<div className="flex gap-2">
// 							{(['bot', 'live'] as const).map((opt) => (
// 								<button
// 									key={opt}
// 									onClick={() => setOpponent(opt)}
// 									className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${opponent === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
// 								>
// 									{opt === 'bot' ? t('lobby.bot') : t('lobby.live')}
// 								</button>
// 							))}
// 						</div>
// 					</div>

// 					{/* Bot difficulty */}
// 					{opponent === 'bot' && (
// 						<div className="mb-6">
// 								<p className="text-[#8892a4] text-xs mb-2">{t('lobby.difficulty')}</p>
// 								<div className="flex gap-2">
// 									{(['easy', 'medium', 'hard'] as const).map((opt) => (
// 										<button
// 											key={opt}
// 											onClick={() => setDifficulty(opt)}
// 											className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer capitalize ${difficulty === opt ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
// 										>
// 											{t(`lobby.${opt}`)}
// 										</button>
// 									))}
// 								</div>
// 						</div>
// 					)}

// 					{/* timer */}
// 					<div className="mb-6">
// 						<p className="text-[#8892a4] text-xs mb-2">{t('lobby.timer')}</p>
// 						<div className="flex gap-2">
// 							{([
// 								{ value: 'none', label: t('lobby.noTimer') },
// 								{ value: '3', label: '3 min' },
// 								{ value: '5', label: '5+3' },
// 								{ value: '10', label: '10+5' },
// 							] as const).map((opt) => (
// 								<button
// 									key={opt.value}
// 									onClick={() => setTimer(opt.value)}
// 									className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer ${timer === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
// 								>
// 									{opt.label}
// 								</button>
// 							))}
// 						</div>
// 					</div>

// 					{/* piece color */}
// 					<div className="mb-6">
// 							<p className="text-[#8892a4] text-xs mb-2">{t('lobby.pieceColor')}</p>
// 							<div className="flex gap-2">
// 								{([
// 									{ value: 'white', label: `♚ ${t('lobby.white')}` },
// 									{ value: 'black', label: `♔ ${t('lobby.black')}` },
// 									{ value: 'random', label: `🎲 ${t('lobby.random')}` },
// 								] as const).map((opt) => (
// 									<button
// 										key={opt.value}
// 										onClick={() => setPieceColor(opt.value)}
// 										className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer ${pieceColor === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
// 									>
// 										{opt.label}
// 									</button>
// 								))}
// 							</div>
// 					</div>

// 					{/* Board theme */}
// 					<div className="mb-6">
// 						<p className="text-[#8892a4] text-xs mb-2">{t('lobby.boardTheme')}</p>
// 						<div className="flex gap-3">
// 								{([
// 									{ value: 'default', light: '#f0eeff', dark: '#2e2e40' },
// 									{ value: 'green', light: '#ffffdd', dark: '#86a666' },
// 									{ value: 'blue', light: '#dee3e6', dark: '#8ca2ad' },
// 									{ value: 'brown', light: '#f0d9b5', dark: '#b58863' },
// 								] as const).map((opt) => (
// 									<button
// 										key={opt.value}
// 										onClick={() => setBoardTheme(opt.value)}
// 										className={`w-10 h-10 rounded-lg border-2 cursor-pointer overflow-hidden p-0 ${boardTheme === opt.value ? 'border-[#e2b96f]' : 'border-transparent'}`}
// 									>
// 										<div className="w-full h-full grid grid-cols-2">
// 											<div style={{ backgroundColor: opt.light }} />
// 											<div style={{ backgroundColor: opt.dark }} />
// 											<div style={{ backgroundColor: opt.dark }} />
// 											<div style={{ backgroundColor: opt.light }} />
// 										</div>
// 									</button>
// 								))}
// 						</div>
// 					</div>


// 					{/* piece theme */}
// 					<div className="mb-6">
// 						<p className="text-[#8892a4] text-xs mb-2">{t('lobby.pieceTheme')}</p>
// 						<div className="flex gap-3">
// 								{([
// 									{ value: 'default', label: `♚ ${t('lobby.default')}` },
// 									{ value: 'simple', label: `♔ ${t('lobby.simple')}` },
// 								] as const).map((opt) => (
// 									<button
// 										key={opt.value}
// 										onClick={() => setPieceTheme(opt.value)}
// 										className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer ${pieceTheme === opt.value ? 'bg-[#e2b96f] text-[#0f0f13] border-[#e2b96f] font-medium' : 'bg-[#0f0f13] text-[#f0eeff] border-[#2e2e40]'}`}
// 									>
// 										{opt.label}
// 									</button>
// 								))}
// 						</div>
// 					</div>



// 					{/* start game */}
// 					<button
// 						onClick={handleStartGame}
// 						disabled={isStarting}
// 						className="w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium cursor-pointer mt-2"
// 					>
// 						▶ {isStarting ? 'Starting...' : t('lobby.startGame')}
// 					</button>

// 					{startError && <p className="text-[#e25f5f] text-xs mt-2 mb-0">{startError}</p>}
// 				</div>
// 			</div>
// 			<Footer />
// 		</div>
// 	)
// }

// export default LobbyPage