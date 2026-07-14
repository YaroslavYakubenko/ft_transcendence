

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
	isGameOver?: boolean
	drawState?: 'idle' | 'offer_sent' | 'offer_received'
	onDrawOffer?: () => void
	onDrawAccept?: () => void
	onDrawDecline?: () => void
}

export default function MoveHistoryPanel({
	moves,
	onResign,
	isResigning,
	resignError,
	isGameOver = false,
	drawState = 'idle',
	onDrawOffer,
	onDrawAccept,
	onDrawDecline,
}: Props) {
	const { t } = useTranslation()

	return (
		<div className="flex flex-col gap-3 w-48">
			{/* Move history */}
			<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-3 flex-1 overflow-y-auto max-h-[500px]">
				<p className="text-[#8896a4] text-xs mb-2 m-0">{t("game.movesHistory")}</p>

				{/* Column headers */}
				<div className="grid grid-cols-[1.5rem_1fr_1fr] gap-1 mb-1">
					<span />
					<span className="text-[#f0eeff] text-xs font-semibold text-center">⬜</span>
					<span className="text-[#1a1a24] bg-[#f0eeff] text-xs font-semibold text-center rounded">⬛</span>
				</div>

				{moves.length === 0 ? (
					<p className="text-[#2e2e40] text-xs">{t("game.noMoves")}</p>
				) : (
					<div className="text-xs space-y-1">
						{moves.map((movePair, i) => (
							<div key={i} className="grid grid-cols-[1.5rem_1fr_1fr] gap-1 items-center">
								<span className="text-[#8896a4]">{i + 1}.</span>
								<span className="text-[#e2b96f] bg-[#12121a] rounded px-1 py-0.5 text-center">
									{movePair.white}
								</span>
								<span className="text-[#a0a8b8] bg-[#12121a] rounded px-1 py-0.5 text-center">
									{movePair.black ?? ''}
								</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Resign button */}
			<button
				onClick={onResign}
				disabled={isResigning || isGameOver}
				className="w-full bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-[#0f0f13] disabled:hover:text-[#e25f5f]"
			>
				{isResigning ? "Resigning..." : t("game.resign")}
			</button>

			{/* Draw button */}
			{drawState === 'offer_received' ? (
				<div className="flex flex-col gap-1">
					<p className="text-[#e2b96f] text-xs text-center m-0">Draw offered</p>
					<div className="flex gap-1">
						<button
							onClick={onDrawAccept}
							className="flex-1 bg-[#0f0f13] border border-[#81b64c] text-[#81b64c] rounded-lg text-xs cursor-pointer hover:bg-[#81b64c] hover:text-[#f0eeff]"
						>
							Accept
						</button>
						<button
							onClick={onDrawDecline}
							className="flex-1 bg-[#0f0f13] border border-[#e25f5f] text-[#e25f5f] rounded-lg text-xs cursor-pointer hover:bg-[#e25f5f] hover:text-[#f0eeff]"
						>
							Decline
						</button>
					</div>
				</div>
			) : (
				<button
					onClick={drawState === 'idle' ? onDrawOffer : undefined}
					disabled={drawState === 'offer_sent' || !onDrawOffer}
					className="w-full bg-[#0f0f13] border border-[#2e2e40] text-[#8892a4] rounded-lg text-sm cursor-pointer hover:border-[#e2b96f] hover:text-[#e2b96f] disabled:opacity-50 disabled:cursor-default disabled:hover:border-[#2e2e40] disabled:hover:text-[#8892a4]"
				>
					{drawState === 'offer_sent' ? 'Draw offered...' : t("game.draw")}
				</button>
			)}

			{/* Error */}
			{resignError && (
				<p className="text-[#e25f5f] text-xs m-0">{resignError}</p>
			)}
		</div>
	)
}