import { useTranslation } from "react-i18next"

type Props = {
	settings: any,
}

export default function OpponentPanel({
	settings,
}: Props) {

	const { t } = useTranslation()

	return (
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
	)
}