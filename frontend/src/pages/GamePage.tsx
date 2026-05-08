import { useState } from "react"
import { useMemo } from "react";
import { useLocation } from "react-router-dom"
import { Chessboard } from "react-chessboard"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useTranslation } from "react-i18next"
import type { PieceHandlerArgs } from "react-chessboard"
import type { PieceDropHandlerArgs } from "react-chessboard"


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
	if (data.log) {
		console.log("LOG:" ,data.log)
		return null; // fallback: no update
	}

	return data;
}

async function do_promotion(fen: string, move: string, key: string) {
	const res = await fetch("http://localhost:8000/do-promotion/", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		fen,
		move,
		key,
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

interface GameSettings {
	opponent: 'bot' | 'live'
	difficulty: 'easy' | 'medium' | 'hard'
	timer: 'none' | '3' | '5' | '10'
	pieceColor: 'white' | 'black' | 'random'
	boardTheme: 'default' | 'green' | 'blue' | 'brown'
	pieceTheme: 'default'
}

const pieceStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
}

const PIECE_THEMES = {
	default: {
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
	const { user } = useAuth()
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
	const pieces = PIECE_THEMES[settings.pieceTheme] ?? PIECE_THEMES.default

	const getPromotionOptions = (prefix: "w" | "b") =>
		ppieces.map((p) => ({
		piece: `${prefix}${p}` as keyof typeof pieces,
		promo: p.toLowerCase(),
	}))

	const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
	const [result, setRes] = useState<string>("ongoing")
	const [promotion, setPro] = useState({
		move: "",
		x: -1,
		y: -1, 
		pre: "" 
	})

	const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
	const [highlightSquares2, setHighlightSquares2] = useState<string[]>([]);


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


	const chessboardOptions =
	{
		// your config options here
		position: fen,
		darkSquareStyle: { backgroundColor: theme.dark },
		lightSquareStyle: { backgroundColor: theme.light },
		customPieces: pieces,

		onPieceDrag: ({ isSparePiece, piece, square }: PieceHandlerArgs) => {
			console.debug("DEBUG: DRAG BEGIN:", isSparePiece, piece, square);
			if (!square)
			{
				setHighlightSquares([]);
				setHighlightSquares2([]);
				return;
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
			make_move(fen, sourceSquare, targetSquare).then((data) => {
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
				setFen(data.fen);
				setRes(data.result);
				setPro({move: data.promotion, x: -1, y: -1, pre: ''})
			});
			setHighlightSquares([]);
			setHighlightSquares2([]);
			return false; // prevent local move, backend is source of truth
		},

	};
	
	const [moves] = useState<string[]>([])
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
							// onMouseDown={(e) => console.log("DOWN", e.clientX, e.clientY) }
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
												do_promotion(fen, promotion.move, promo).then((data) => {
													if (!data) return;
													setFen(data.fen);
													setRes(data.result);
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
					<div className="flex flex-col gap-3 w-48">
						<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 flex-1">
							<p className="text-[#8896a4] text-xs mb-2 m-0">{t('game.movesHistory')}</p>
							{moves.length === 0 ? (
								<p className="text-[#2e2e40] text-xs">{t('game.noMoves')}</p>
							) : (
								<div className="text-[#f0eeff] text-xs space-y-1">
									{moves.map((move, i) => (
										<span key={i} className="block">{move}</span>
									))}
								</div>
							)}
						</div>
						<button className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]">
							{t('game.resign')}
						</button>
						<button className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f]">
							{t('game.draw')}
						</button>
					</div>

					{/* gameover	make better with rematch option and stuff*/}
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
			</div>
			<Footer />
		</div>
	)
}

export default GamePage

// tabading@example.com Hello1295!
// 