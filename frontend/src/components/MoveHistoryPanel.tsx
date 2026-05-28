

import { useTranslation } from "react-i18next"

type MovePair = {
	white: string
	black?: string
}

type Props = {
	moves: MovePair[]
	onResign: () => void
	isResigning: boolean
	resignError?: string
}

export default function MoveHistoryPanel({
	moves,
	onResign,
	isResigning,
	resignError,
}: Props) {
	const { t } = useTranslation()

	return (
		<div className="flex flex-col gap-3 w-48">
			{/* Move history */}
			<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 flex-1 overflow-y-auto max-h-[500px]">
				<p className="text-[#8896a4] text-xs mb-2 m-0">{t("game.movesHistory")}</p>

				{moves.length === 0 ? (
					<p className="text-[#2e2e40] text-xs">{t("game.noMoves")}</p>
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

			{/* Resign button */}
			<button
				onClick={onResign}
				disabled={isResigning}
				className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]"
			>
				{isResigning ? "Resigning..." : t("game.resign")}
			</button>

			{/* Draw button */}
			<button className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f]">
				{t("game.draw")}
			</button>

			{/* Error */}
			{resignError && (
				<p className="text-[#e25f5f] text-xs m-0">{resignError}</p>
			)}
		</div>
	)
}