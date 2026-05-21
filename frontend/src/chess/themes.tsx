import {defaultPieces} 	from "react-chessboard"


const pieceStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
}


export const PIECE_THEMES = {
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

export const BOARD_THEMES = {
	default: { light: '#f0eeff', dark: '#2e2e40' },
	green: { light: '#ffffdd', dark: '#86a666' },
	blue: { light: '#dee3e6', dark: '#8ca2ad' },
	brown: { light: '#f0d9b5', dark: '#b58863' },
}


export const createSquareStyles = (
	highlightSquares: string[],
	highlightSquares2: string[],
	checkSquare: string | null
): Record<string, React.CSSProperties> => {
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

	if (checkSquare) {
		styles[checkSquare] = {
			background:
				"radial-gradient(circle, rgba(255,0,0,0.35) 0%, rgba(180,0,0,0.8) 85%)",
		};
	}

	return styles;
};