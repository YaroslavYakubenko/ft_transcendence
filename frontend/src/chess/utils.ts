
import { PROMOTION_PIECES, SQUARE_SIZE } from "../chess/constants"



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
	}));


export type MovePair = {
	white: string;
	black?: string;
};

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
