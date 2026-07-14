import { getPromotionOptions, appendMove} from "../chess/utils"


type Props = {
	promotion: {
		move: string
		x: number
		y: number
		pre: string
	}
	pieces: any
	fen: string
	setMoves: React.Dispatch<React.SetStateAction<{ white: string; black?: string }[]>>
	setFen: React.Dispatch<React.SetStateAction<string>>
	setRes: React.Dispatch<React.SetStateAction<{ state: string; winner: string }>>
	setPro: React.Dispatch<React.SetStateAction<{ move: string; x: number; y: number; pre: string }>>
	do_promotion: (fen: string, move: string, promo: string) => Promise<PromotionResponse | null>
	onWsPromotion?: (promo: string) => void
}

type PromotionResponse = {
	fen: string
	result: string
	winner: string
}

//  split do promotion elsewhere, utils ore something
export default function PromotionSelector({
	promotion,
	pieces,
	fen,
	setMoves,
	setFen,
	setRes,
	setPro,
	do_promotion,
	onWsPromotion,
}: Props) {
	if (!promotion.move) return null


	const handlePromotion = (promo: string) => {
		if (onWsPromotion) {
			onWsPromotion(promo)
			setPro({ move: "", x: -1, y: -1, pre: "" })
			return
		}

		do_promotion( fen, promotion.move, promo).then((data) => {
			if (!data) return

			// Add promotion move to history
			const moveNotation = `${promotion.move}${promo}`
			const isWhiteMove = fen.split(" ")[1] === "w"
			setMoves((prevMoves) =>
				appendMove(prevMoves, moveNotation, isWhiteMove)
			)

			// update vars
			setFen(data.fen)
			setRes({ state: data.result, winner: data.winner, })
			setPro({ move: "", x: -1, y: -1, pre: "", })
		})
	}

	return (
		<div className="absolute z-[9999] flex h-[280px] w-20 -translate-x-1/2 flex-col gap-2.5 rounded-[10px] bg-white p-3"
			style={{
				left: promotion.x,
				top: promotion.y,
			}} >
			{getPromotionOptions(promotion.pre as "w" | "b").map(( { piece, promo } ) => {
					const Piece = pieces[piece]

					return (
						<button
							key={promo}
							onClick={() => handlePromotion(promo)}>
							{Piece()}
						</button>
					)
				}
			)}
		</div>
	)
}

