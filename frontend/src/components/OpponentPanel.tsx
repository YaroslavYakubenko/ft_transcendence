import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { addFriend, getFriends } from "../api/social"
import { useToast } from "../context/ToastContext"

function formatTime(seconds: number | null, fallback: string): string {
	if (seconds === null) return fallback
	const m = Math.floor(seconds / 60).toString().padStart(2, '0')
	const s = (seconds % 60).toString().padStart(2, '0')
	return `${m}:${s}`
}

type Props = {
	settings: any
	opponent?: { id: number; name: string } | null
	time: number | null
}

export default function OpponentPanel({ settings, opponent, time }: Props) {
	const { t } = useTranslation()
	const { token, friendRemoved, friendAdded } = useAuth()
	const { showToast } = useToast()
	const navigate = useNavigate()
	const [added, setAdded] = useState(false)
	const [adding, setAdding] = useState(false)

	useEffect(() => {
		if (!opponent || !token) return
		const controller = new AbortController()
		getFriends(token, controller.signal).then(friends => {
			if (friends.some(f => f.id === opponent.id))
				setAdded(true)
		}).catch(() => {})
		return () => controller.abort()
	}, [opponent?.id, token])

	useEffect(() => {
		if (!friendRemoved || !opponent) return
		if (friendRemoved.removed_by_id === opponent.id)
			setAdded(false)
	}, [friendRemoved])

	useEffect(() => {
		if (!friendAdded || !opponent) return
		if (friendAdded.added_by_id === opponent.id)
			setAdded(true)
	}, [friendAdded])

	const isLive = settings.opponent === 'live'

	const handleAddFriend = async () => {
		if (!opponent || !token) return
		setAdding(true)
		try {
			await addFriend(opponent.id, token)
			setAdded(true)
			showToast(t('toast.friendAdded'))
		} catch {
			// already friends or error — still mark as added
			setAdded(true)
		} finally {
			setAdding(false)
		}
	}

	const displayName = isLive && opponent
		? opponent.name
		: settings.opponent === 'bot'
			? `${t('lobby.bot')} (${t(`lobby.${settings.difficulty}`)})`
			: t('lobby.opponent')

	const initial = isLive && opponent
		? opponent.name[0].toUpperCase()
		: settings.opponent === 'bot' ? 'AI' : '?'

	return (
		<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl px-4 py-3 flex items-center justify-between w-[500px]">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-[#3d3d55] border border-[#5a5a7a] flex items-center justify-center text-[#f0eeff] text-xs font-bold">
					{initial}
				</div>
				<span className="text-[#f0eeff] text-sm font-medium">
					{displayName}
				</span>

				{isLive && opponent && (
					<div className="flex items-center gap-2 ml-1">
						<button
							onClick={() => navigate(`/users/${opponent.id}`)}
							className="text-[#8892a4] text-xs hover:text-[#e2b96f] transition-colors cursor-pointer"
						>
							{t("nav.profile")}
						</button>
						<span className="text-[#2e2e40] text-xs">|</span>
						<button
							onClick={handleAddFriend}
							disabled={added || adding}
							className={`text-xs transition-colors cursor-pointer ${
								added
									? 'text-[#81b64c]'
									: 'text-[#8892a4] hover:text-[#81b64c]'
							}`}
						>
							{added ? `✓ ${t("game.friend")}` : adding ? '...' : `+ ${t("game.friend")}`}
						</button>
					</div>
				)}
			</div>
			<span className={`text-sm font-mono ${time !== null && time <= 30 && settings.timer !== 'none' ? 'text-[#e25f5f]' : 'text-[#e2b96f]'}`}>
				{settings.timer === 'none' ? '∞' : formatTime(time, `${settings.timer}:00`)}
			</span>
		</div>
	)
}
