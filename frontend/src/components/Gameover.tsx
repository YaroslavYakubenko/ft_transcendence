
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import type  { User } from "../context/AuthContext"
import { check_color } from "../api/game"

import { useEffect } from "react"

type RestartGameResult = {
	gameId?: number
	user?: 'white' | 'black'
}

type Props = {
	result: {
		state: string
		winner: string
	}
	settings: any
	user:  User | null
	token: string | null
	gameId: Number | null
	restartGame: () => Promise<RestartGameResult>
}

export default function Gameover({
	result,
	settings,
	user,
	token,
	gameId,
	restartGame,
}: Props){
	const navigate = useNavigate()
	const { t } = useTranslation()

	useEffect(() => {
		if (result.state === "ongoing")
			return ;
		if (user)
		{
			// console.debug("user id", user.id)
			// console.debug("game id", gameId)

			check_color(gameId, token, result.winner)

		}
	}, [user, token, result.winner, result.state]);


	if (result.state === "ongoing")
		return null;
	

	const handleRematch = async () => {
		const res = await restartGame()

		if (!res.gameId) {
			console.error("Failed to create rematch")
			return
		}

		if (settings.opponent === 'live') {
			navigate('/waiting_room', {
				state: {
					...settings,
					userColor: res.user,
					game_id: res.gameId,
				},
			})
		} else {
			navigate("/game", {
				state: {
					...settings,
					userColor: res.user,
					game_id: res.gameId,
					rematchId: res.gameId,
				},
			})
		}
	}

	return (
		<div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm">
			<div className="w-[320px] rounded-[14px] border border-[#3a3937] bg-[#262522] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-[#f0eeff] flex flex-col gap-4">

				{/* Result header */}
				<div className="text-center">
					<div className="text-[18px] font-bold">
						{result?.winner ? ` ${t(`game.${result.winner}`)} ${t('game.Won')}` : t("game.draw") }
					</div>

					<div className="mt-1 text-xs text-[#8892a4]">
						{ t(`game.${result.state}`) }
					</div>
				</div>

				{/* Divider */}
				<div className="h-px bg-[#3a3937]" />

				{/* Buttons */}
				<div className="flex gap-2.5">
					<button
						type="button"
						className="flex-1 rounded-lg bg-[#81b64c] px-4 py-2.5 font-semibold text-white cursor-pointer"
						onClick={handleRematch}
					>
						{t("game.rematch")}
					</button>

					<button
						type="button"
						className="flex-1 rounded-lg bg-[#3a3937] px-4 py-2.5 font-semibold text-[#f0eeff] cursor-pointer"
						onClick={() => navigate("/")}
					>
						{t("game.home")}
					</button>
				</div>
			</div>
		</div>
	)

}