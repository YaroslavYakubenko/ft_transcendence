
function formatTime(seconds: number | null, fallback: string): string {
	if (seconds === null) return fallback
	const m = Math.floor(seconds / 60).toString().padStart(2, '0')
	const s = (seconds % 60).toString().padStart(2, '0')
	return `${m}:${s}`
}

type Props = {
	settings: any,
	user: any,
	time: number | null,
}

export default function PlayerPanel({ settings, user, time }: Props) {
	const displayTime = settings.timer === 'none'
		? '∞'
		: formatTime(time, `${settings.timer}:00`)

	const isLow = time !== null && time <= 30 && settings.timer !== 'none'

	return (
		<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 mt-2 flex items-center justify-between w-[500px]">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-xs font-bold">
					{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
				</div>
				<span className="text-[#f0eeff] text-sm font-medium">
					{user?.username || user?.email || 'You'}
				</span>
			</div>
			<span className={`text-sm font-mono ${isLow ? 'text-[#e25f5f]' : 'text-[#e2b96f]'}`}>
				{displayTime}
			</span>
		</div>
	)
}