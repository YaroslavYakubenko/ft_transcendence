
type Props = {
	settings: any,
	user: any,
}

export default function PlayerPanel({
	settings,
	user,
}: Props) {

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
			<span className="text-[#e2b96f] text-sm font-mono">
				{settings.timer === 'none' ? '∞' : `${settings.timer}:00`}
			</span>
		</div>
	)
}