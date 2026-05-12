import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Chessboard, defaultPieces} from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useTranslation } from "react-i18next"
import type { PieceHandlerArgs } from "react-chessboard"
import type { PieceDropHandlerArgs } from "react-chessboard"


interface GameResult {
	winner: "white" | "black" | null
	termination: string
	message: string
	pgn_result: string
}

interface GameEventPayload {
	type?: string
	game_over?: boolean
	result?: GameResult | null
	fen?: string
	promotion?: string
}


async function make_move(fen: string, from: string, to: string, gameId?: number | null) {
	const res = await fetch("http://localhost:8000/make-move/", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		fen,
		from,
		to,
		game_id: gameId ?? undefined,
	}),
	});

	const data = await res.json();

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	if (data.log) {
		console.log("LOG:" ,data.log)
		return null; // fallback: no update
	}

	return data;
}

async function do_promotion(fen: string, move: string, key: string, gameId?: number | null) {
	const from = move.slice(0, 2)
	const to = move.slice(2, 4)
	const res = await fetch("http://localhost:8000/do-promotion/", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		fen,
		move,
		from,
		to,
		key,
		game_id: gameId ?? undefined,
	}),
	});

	const data = await res.json();

	// console.log(data);

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	if (data.log) {
		console.log("LOG:" ,data.log)
		return null; // fallback: no update
	}

	return data;
}

async function legal_moves(fen: string) {
	const res = await fetch("http://localhost:8000/legal-moves/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			fen,
		}),
	});

	const data = await res.json();

	// console.log(data);

	if (data.error) {
		console.error(data.error);
		return null; // fallback: no update
	}
	return data;
}

async function resign_game(gameId: number | null, token: string | null) {
	if (!gameId || !token) {
		console.error("Game ID or token missing");
		return null;
	}

	const res = await fetch("http://localhost:8000/resign/", {
		method: "POST",
		headers: {
			"Authorization": `Token ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			game_id: gameId,
		}),
	});

	const data = await res.json();

	if (data.error) {
		console.error(data.error);
		return null;
	}

	return data;
}

// Scholar's Mate sequence: e4 e5, Qh5 Nc6, Bc4 Nf6?, Qxf7#
const SCHOLARS_MATE_MOVES = [
	{ from: "e2", to: "e4", name: "e2e4" },       // 1. e4
	{ from: "e7", to: "e5", name: "e7e5" },       // 1... e5
	{ from: "d1", to: "h5", name: "d1h5" },      // 2. Qh5
	{ from: "b8", to: "c6", name: "b8c6" },      // 2... Nc6
	{ from: "f1", to: "c4", name: "f1c4" },      // 3. Bc4
	{ from: "g8", to: "f6", name: "g8f6" },      // 3... Nf6?
	{ from: "h5", to: "f7", name: "h5f7" },    // 4. Qxf7# Checkmate
];

async function playScholarsMate(
	currentFen: string,
	gameId: number | null,
	setFen: (fen: string) => void,
	setGameResult: (result: GameResult) => void,
	setMoves: (updater: (prev: { white: string; black?: string }[]) => { white: string; black?: string }[]) => void
) {
	let fen = currentFen;
	
	for (let i = 0; i < SCHOLARS_MATE_MOVES.length; i++) {
		const { from, to, name } = SCHOLARS_MATE_MOVES[i];
		const data = await make_move(fen, from, to, gameId);
		
		if (!data) {
			console.error(`Scholar's Mate move ${i + 1} failed: ${name}`);
			return;
		}
		
		fen = data.fen;
		setFen(fen);
		if (data.game_over && data.result) {
			setGameResult(data.result)
		}
		
		// Add move to history
		const isWhiteMove = i % 2 === 0;
		setMoves(prevMoves => {
			const newMoves = [...prevMoves];
			const moveNum = Math.floor(i / 2) + 1;
			
			if (isWhiteMove) {
				if (newMoves.length < moveNum) {
					newMoves.push({ white: name });
				} else {
					newMoves[moveNum - 1].white = name;
				}
			} else {
				if (newMoves.length < moveNum) {
					newMoves.push({ white: "", black: name });
				} else {
					newMoves[moveNum - 1].black = name;
				}
			}
			return newMoves;
		});
		
		// Add small delay between moves for visibility
		await new Promise(resolve => setTimeout(resolve, 500));
	}
}

interface GameSettings {
	opponent: 'bot' | 'live'
	difficulty: 'easy' | 'medium' | 'hard'
	timer: 'none' | '3' | '5' | '10'
	pieceColor: 'white' | 'black' | 'random'
	boardTheme: 'default' | 'green' | 'blue' | 'brown'
	pieceTheme: 'default' | 'simple'
}

const pieceStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
}

const PIECE_THEMES = {
	default: {
		 ...defaultPieces
	},

	simple: {
		wP: () => <img src="/imgs/wp.png" style={pieceStyle} />,
		wN: () => <img src="/imgs/wn.png"  style={pieceStyle} />,
		wB: () => <img src="/imgs/wb.png"  style={pieceStyle} />,
		wR: () => <img src="/imgs/wr.png"  style={pieceStyle} />,
		wQ: () => <img src="/imgs/wq.png"  style={pieceStyle} />,
		wK: () => <img src="/imgs/wk.png"  style={pieceStyle} />,

		bP: () => <img src="/imgs/bp.png"  style={pieceStyle} />,
		bN: () => <img src="/imgs/bn.png"  style={pieceStyle} />,
		bB: () => <img src="/imgs/bb.png"  style={pieceStyle} />,
		bR: () => <img src="/imgs/br.png"  style={pieceStyle} />,
		bQ: () => <img src="/imgs/bq.png"  style={pieceStyle} />,
		bK: () => <img src="/imgs/bk.png"  style={pieceStyle} />,
	},
}

const ppieces = ["Q", "R", "B", "N"] as const


const BOARD_THEMES = {
	default: { light: '#f0eeff', dark: '#2e2e40' },
	green: { light: '#ffffdd', dark: '#86a666' },
	blue: { light: '#dee3e6', dark: '#8ca2ad' },
	brown: { light: '#f0d9b5', dark: '#b58863' },
}

function GamePage() {
	const { user, token } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const settings: GameSettings = location.state ?? {
		opponent: 'bot',
		difficulty: 'medium',
		timer: 'none',
		pieceColor: 'random',
		boardTheme: 'default',
		pieceTheme: 'default',
	}
	const theme = BOARD_THEMES[settings.boardTheme]
	const pieces = PIECE_THEMES[settings.pieceTheme]
	const wsRef = useRef<WebSocket | null>(null)

	const locationState = (location.state as Record<string, unknown>) ?? {}
	const gameIdFromState =
		locationState.game_id ??
		locationState.gameId ??
		((locationState.game as { id?: number } | undefined)?.id ?? null)
	const gameId = typeof gameIdFromState === "number" ? gameIdFromState : null

	const getPromotionOptions = (prefix: "w" | "b") =>
		ppieces.map((p) => ({
		piece: `${prefix}${p}` as keyof typeof pieces,
		promo: p.toLowerCase(),
	}))

	const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
	const [gameResult, setGameResult] = useState<GameResult | null>(null)
	const [promotion, setPro] = useState({
		move: "",
		x: -1,
		y: -1, 
		pre: "" 
	})

	const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
	const [highlightSquares2, setHighlightSquares2] = useState<string[]>([]);
	const [moves, setMoves] = useState<{ white: string; black?: string }[]>([]);
	const [resignError, setResignError] = useState<string>("");
	const [isResigning, setIsResigning] = useState(false);
	const [isPlayingScholarsMate, setIsPlayingScholarsMate] = useState(false);

	useEffect(() => {
		if (!gameId || !token) {
			return
		}

		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}

		const ws = new WebSocket(`wss://localhost:8443/ws/game/${gameId}/?token=${token}`)

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data) as GameEventPayload
			if (data.type === "game_over" && data.result) {
				setGameResult(data.result)
				if (data.fen) {
					setFen(data.fen)
				}
			}
		}

		ws.onerror = (event) => console.error("Game websocket error:", event)
		ws.onclose = () => console.log("Game websocket closed")

		wsRef.current = ws

		return () => {
			ws.close()
			if (wsRef.current === ws) {
				wsRef.current = null
			}
		}
	}, [gameId, token])

	const handleResign = async () => {
		setResignError("");

		if (gameResult) {
			return
		}

		if (!token) {
			setResignError("You must be logged in to resign.");
			return;
		}

		if (!gameId) {
			setResignError("No game ID found. Resign is unavailable for this game.");
			return;
		}

		setIsResigning(true);
		const data = await resign_game(gameId, token);
		setIsResigning(false);

		if (!data) {
			setResignError("Resign request failed.");
			return;
		}

		if (data.result) {
			setGameResult(data.result)
			if (data.fen) {
				setFen(data.fen)
			}
		}
	}

	const handleScholarsMate = async () => {
		if (gameResult) {
			console.log("Game is not ongoing");
			return;
		}

		setIsPlayingScholarsMate(true);
		await playScholarsMate(fen, gameId, setFen, setGameResult, setMoves)
		setIsPlayingScholarsMate(false);
	}


	const customSquareStyles = useMemo(() => {
		const styles: Record<string, React.CSSProperties> = {};

		highlightSquares.forEach((sq) => {
		styles[sq] = {
			background:
			"radial-gradient(circle, rgba(244, 201, 148, 0.9) 25%, transparent 25%)",
		};
		});

		highlightSquares2.forEach((sq) => {
		styles[sq] = {
			background:
			"radial-gradient(circle, transparent 50%, rgba(244, 201, 148, 0.9) 50%, rgba(244, 201, 148, 0.9) 60%, transparent 60%)",
		};
		});

		return styles;
	}, [highlightSquares, highlightSquares2]);


	// const customPieces: 

	const chessboardOptions =
	{
		// your config options here
		position: fen,
		darkSquareStyle: { backgroundColor: theme.dark },
		lightSquareStyle: { backgroundColor: theme.light },
		pieces: pieces,

		onPieceDrag: ({ isSparePiece, piece, square }: PieceHandlerArgs) => {
			console.debug("DEBUG: DRAG BEGIN:", isSparePiece, piece, square);
			if (!square)
			{
				setHighlightSquares([]);
				setHighlightSquares2([]);
				return;
			}
			if (gameResult) {
				return
			}
			const currentFen = fen;
			legal_moves(currentFen).then((data) => {
				if (!piece)
					return;
				console.debug("DEBUG: SOURCE:", square);
				console.debug("DEBUG: HIGHLIGHT KEYS:", Object.keys(data.moves));
				const newhigh = data.moves[square] || [];
				setHighlightSquares(newhigh);
				const newhigh2 = data.moves2[square] || [];
				setHighlightSquares2(newhigh2);
				console.debug('DEBUG: HIGHLIGHT SQUARES:', newhigh);
				console.debug('DEBUG: HIGHLIGHT SQUARES:', newhigh2);
			});
		},

		onPieceDrop: ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
			if (!sourceSquare || !targetSquare)
				return false;
			if (gameResult)
				return false;
			make_move(fen, sourceSquare, targetSquare, gameId).then((data) => {
				if (!data)
					return;
				if (data.promotion !== '') {
					const squareSize = 500 / 8; // 62.5px
					const file = targetSquare[0].charCodeAt(0) - 97
					const rank = 8 - Number(targetSquare[1])
					const offset = squareSize / 2 + 8

					const x = file * squareSize + squareSize / 2
					const centerY = rank * squareSize + squareSize / 2
					if (fen.split(" ")[1] === "w")
					{
						const y = centerY + offset
						setPro({move: data.promotion, x: x , y: y, pre: 'w'})
					}
					else
					{
						const y = centerY - offset - 280
						setPro({move: data.promotion, x: x , y: y, pre: 'b'})
					}

					return;
				}
				if (data.game_over && data.result) {
					setGameResult(data.result)
				}
				
				// Add move to history (UCI format: e2e4)
				const moveNotation = `${sourceSquare}${targetSquare}`;
				const isWhiteMove = fen.split(" ")[1] === "w";
				
				setMoves(prevMoves => {
					const newMoves = [...prevMoves];
					if (isWhiteMove) {
						// White just moved
						newMoves.push({ white: moveNotation });
					} else {
						// Black just moved, add to last white move
						if (newMoves.length > 0) {
							newMoves[newMoves.length - 1].black = moveNotation;
						} else {
							// Shouldn't happen, but handle it
							newMoves.push({ white: "", black: moveNotation });
						}
					}
					return newMoves;
				});
				
				setFen(data.fen);
				setPro({move: data.promotion, x: -1, y: -1, pre: ''})
			});
			setHighlightSquares([]);
			setHighlightSquares2([]);
			return false; // prevent local move, backend is source of truth
		},

	};
	
	const { t } = useTranslation()

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center py-8">
				<div className="flex gap-4 items-start">

					{/* Left - board + player pannels */}
					<div className="flex flex-col">

						{/* Opponent panel */}
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 flex mt-2 items-center justify-between w-[500px]">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-[#3d3d55] border border-[#5a5a7a] flex items-center justify-center text-[#f0eeff] text-xs font-bold">
									{settings.opponent == 'bot' ? 'AI' : '?'}
								</div>
								<span className="text-[#f0eeff] text-sm font-medium">
									{settings.opponent === 'bot' ? `${t('lobby.bot')} (${t(`lobby.${settings.difficulty}`)})` : t('lobby.opponent')}
								</span>
							</div>
							<span className="text-[#e2b96f] text-sm font-mono">
								{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
							</span>
						</div>

						{/* Board */}
						<div 
							className="relative w-[500px]" 
							>
							<Chessboard 
							options={{
								...chessboardOptions,
								squareStyles: customSquareStyles,
							}} />

							{/* promotion */}
							{promotion.move && (
								<div			
									style={{
										position: "absolute",
										width: 80,
										height: 280,
										left: promotion.x,
										top: promotion.y,
										transform: "translateX(-50%)",
										zIndex: 9999,
										background: "#ffffff",
										padding: "12px",
										borderRadius: "10px",
										display: "flex",
										flexDirection: "column",
										gap: "10px",
									}} >


									{getPromotionOptions(promotion.pre as "w" | "b").map(( {piece, promo} ) => {
										const Piece = pieces[piece]
									
										return (
										<button
											key={promo}
											onClick={() => {
												console.log(getPromotionOptions(promotion.pre as "w" | "b"))
												do_promotion(fen, promotion.move, promo, gameId).then((data) => {
													if (!data) return;
													if (data.game_over && data.result) {
														setGameResult(data.result)
													}
													
												// Add promotion move to history (UCI format: e7e8q)
												const moveNotation = `${promotion.move}${promo.toLowerCase()}`;
													const isWhiteMove = fen.split(" ")[1] === "w";
													
													setMoves(prevMoves => {
														const newMoves = [...prevMoves];
														if (isWhiteMove) {
															newMoves.push({ white: moveNotation });
														} else {
															if (newMoves.length > 0) {
																newMoves[newMoves.length - 1].black = moveNotation;
															} else {
																newMoves.push({ white: "", black: moveNotation });
															}
														}
														return newMoves;
													});
													
													setFen(data.fen);
													setPro({move: "", x: -1, y: -1, pre: ''}); // IMPORTANT: clear UI
												});
											}} >
									{Piece()}
									{/* {'hello'} */}
										</button>
									)})}
								</div>
							)}

						</div>

						{/* Player panel */}
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 mt-2 flex items-center justify-between w-[500px]">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-xs font-bold">
										{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
									</div>
									<span className="text-[#f0eeff] text-sm font-medium">
										{user?.username || user?.email || 'You'}
									</span>
								</div>
								<span className="text-[#e2b96f] text-sm font-mono">
									{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
								</span>
						</div>
					</div>

					{/* Right - move history + buttons */}
					<div className="flex flex-col gap-3 w-48 h-fit mt-2">
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 overflow-y-auto h-[620px]">
							<p className="text-[#8896a4] text-xs mb-2 m-0">{t('game.movesHistory')}</p>
							{moves.length === 0 ? (
								<p className="text-[#2e2e40] text-xs">{t('game.noMoves')}</p>
							) : (
								<div className="text-[#f0eeff] text-xs space-y-1">
									{moves.map((movePair, i) => (
										<div key={i} className="flex gap-2">
											<span className="text-[#8896a4] min-w-[1.5rem]">{i + 1}.</span>
											<span className="text-[#e2b96f]">{movePair.white}</span>
											{movePair.black && <span className="text-[#8896a4]">{movePair.black}</span>}
										</div>
									))}
								</div>
							)}
						</div>
						<button
							onClick={handleResign}
							disabled={isResigning}
							className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]"
						>
							{isResigning ? 'Resigning...' : t('game.resign')}
						</button>
					<button 
						onClick={handleScholarsMate}
						disabled={isPlayingScholarsMate || Boolean(gameResult)}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f] disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPlayingScholarsMate ? 'Scholar\'s Mate...' : t('game.draw')}
						</button>
						{resignError && (
							<p className="text-[#e25f5f] text-xs m-0">{resignError}</p>
						)}
					</div>

					{gameResult && (
						<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4">
							<div className="w-full max-w-2xl rounded-2xl border border-[#2e2e40] bg-[#1a1a24] p-6 shadow-2xl flex flex-col max-h-[80vh]">
								<div className="text-center mb-4">
									<p className="text-[#8896a4] text-xs uppercase tracking-[0.3em] mb-2">Game Over</p>
									<h2 className="text-[#f0eeff] text-2xl font-semibold mb-2">{gameResult.message}</h2>
									<p className="text-[#e2b96f] text-lg font-mono">PGN result: {gameResult.pgn_result}</p>
								</div>

								{/* Moves History */}
								<div className="flex-1 overflow-y-auto mb-4 px-4 py-3 bg-[#0f0f13] rounded-lg border border-[#2e2e40]">
									<p className="text-[#8896a4] text-xs mb-3 m-0">{t('game.movesHistory')}</p>
									{moves.length === 0 ? (
										<p className="text-[#2e2e40] text-xs">{t('game.noMoves')}</p>
									) : (
										<div className="text-[#f0eeff] text-sm space-y-1">
											{moves.map((movePair, i) => (
												<div key={i} className="flex gap-3">
													<span className="text-[#8896a4] min-w-[2rem] font-mono">{i + 1}.</span>
													<span className="text-[#e2b96f]">{movePair.white}</span>
													{movePair.black && <span className="text-[#8896a4]">{movePair.black}</span>}
												</div>
											))}
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col sm:flex-row gap-3 justify-center">
									<button
										onClick={() => navigate('/lobby', { state: settings })}
										className="rounded-lg border border-[#e2b96f] bg-[#e2b96f] px-4 py-2 text-sm font-medium text-[#0f0f13] cursor-pointer"
									>
										Rematch
									</button>
									<button
										onClick={() => navigate('/lobby')}
										className="rounded-lg border border-[#2e2e40] bg-[#0f0f13] px-4 py-2 text-sm font-medium text-[#f0eeff] cursor-pointer"
									>
										New Game
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default GamePage

// tabading@example.com Hello1295!
// 