import { PROMOTION_PIECES, SQUARE_SIZE } from "../chess/constants"
import type { PieceHandlerArgs, PieceDropHandlerArgs } from "react-chessboard"


function getPieceAt(fen: string, square: string): string | null {
	const file = square.charCodeAt(0) - 97   // 'a'=0 … 'h'=7
	const rank = parseInt(square[1]) - 1     // '1'=0 … '8'=7
	const rows = fen.split(' ')[0].split('/')
	const row = rows[7 - rank]               // FEN: rank 8 is index 0
	let col = 0
	for (const ch of row) {
		if (ch >= '1' && ch <= '8') {
			col += parseInt(ch)
		} else {
			if (col === file) return ch
			col++
		}
	}
	return null
}

export function requiresPromotion(fen: string, from: string, to: string): boolean {
	const turn = fen.split(' ')[1]
	const toRank = to[1]
	if (turn === 'w' && toRank === '8') return getPieceAt(fen, from) === 'P'
	if (turn === 'b' && toRank === '1') return getPieceAt(fen, from) === 'p'
	return false
}

export function sideChoice(pieceColor: "white" | "black" | "random"): "white" | "black"
{
	if (pieceColor === "random")
	{
		return Math.random() < 0.5 ? "white" : "black";
	}
	return pieceColor
}

export const getPromotionOptions = (prefix: "w" | "b") =>
	PROMOTION_PIECES.map((p) => ({
		piece: `${prefix}${p}` as const,
		promo: p.toLowerCase(),
}))

type MovePair = {
	white: string;
	black?: string;
}

export function appendMove(
	prevMoves: MovePair[],
	moveNotation: string,
	isWhiteMove: boolean
): MovePair[] {
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
}

export function getBoardCoordinates(
	targetSquare: string,
	playerColor: "white" | "black",
	fen: string
) {
	let file = targetSquare[0].charCodeAt(0) - 97;
	let rank = 8 - Number(targetSquare[1]);

	if (playerColor === "black") {
		file = 7 - file;
		rank = 7 - rank;
	}

	const offset = SQUARE_SIZE / 2 + 8;

	const x = file * SQUARE_SIZE + SQUARE_SIZE / 2;
	const centerY = rank * SQUARE_SIZE + SQUARE_SIZE / 2;

	const isMovingTowardBottom =
		(fen.split(" ")[1] === "w" && playerColor === "white") ||
		(fen.split(" ")[1] === "b" && playerColor === "black");

	const y = isMovingTowardBottom
		? centerY + offset
		: centerY - offset - 280;

	return { x, y };
}

export function createOnPieceDrag({
	fen,
	setHighlightSquares,
	setHighlightSquares2,
	legal_moves,
	effectiveColor,
}: any) {
	return ({ isSparePiece, piece, square }: PieceHandlerArgs) => {
		console.log("DEBUG: DRAG BEGIN:", isSparePiece, piece, square);

		if (!square || !piece) {
			setHighlightSquares([]);
			setHighlightSquares2([]);
			return;
		}

		const fenTurn = fen.split(' ')[1]              // 'w' or 'b'
		const pieceType = typeof piece === 'string' ? piece : (piece as any).pieceType
		const pieceColor = pieceType?.[0]              // 'w' or 'b'

		// Only show highlights for the side whose turn it is
		if (pieceColor !== fenTurn) {
			setHighlightSquares([]);
			setHighlightSquares2([]);
			return;
		}

		legal_moves(fen).then((data: any) => {
			const newhigh = data.moves[square] || [];
			setHighlightSquares(newhigh);
			const newhigh2 = data.moves2[square] || [];
			setHighlightSquares2(newhigh2);
		});
	};
}

export function createOnPieceDrop({
	fen,
	gameId,
	playerColor,
	make_move,
	getBoardCoordinates,
	appendMove,
	setMoves,
	setFen,
	setRes,
	setPro,
	setCheckSquare,
	setHighlightSquares,
	setHighlightSquares2,
}: any) {
	return ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
		if (!sourceSquare || !targetSquare)
			return false;

		make_move(fen, sourceSquare, targetSquare, gameId).then((data: any) => {
			if (!data) return;

			// get position of the promotion menue 
			if (data.promotion !== '') {
				const { x, y } = getBoardCoordinates( targetSquare, playerColor, fen );
				setPro({ move: data.promotion, x: x , y: y, pre: fen.split(" ")[1] });
				return;
			}

			// Add move to history
			const moveNotation = `${sourceSquare}${targetSquare}`;
			const isWhiteMove = fen.split(" ")[1] === "w";
			setMoves((prevMoves: any) =>
				appendMove(prevMoves, moveNotation, isWhiteMove)
			);

			// update variables
			setFen(data.fen);
			setRes({ state: data.result, winner: data.winner });
			setPro({ move: data.promotion, x: -1, y: -1, pre: "" });
			setCheckSquare(data.kingpos || null);
		});

		// after movement reset highlights
		setHighlightSquares([]);
		setHighlightSquares2([]);
		return false;
	};
}


export function getGameId(state: unknown): number | null {
	if (!state || typeof state !== "object") {
		return null
	}

	const locationState = state as Record<string, unknown>

	const gameId =
		locationState.game_id ??
		locationState.gameId ??
		(locationState.game as { id?: number } | undefined)?.id

	return typeof gameId === "number" ? gameId : null
}