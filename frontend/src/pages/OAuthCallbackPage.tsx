import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { oauthLogin, type OAuthProvider } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"

function OAuthCallbackPage() {
	const [error, setError] = useState('')
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { login } = useAuth()
	const hasRun = useRef(false)
	const { t } = useTranslation()

	useEffect(() => {
		const code = searchParams.get('code')
		const state = searchParams.get('state')
		const provider = state?.split(':', 1)[0] as OAuthProvider | undefined

		if (hasRun.current) return
		hasRun.current = true
		if (!code || !state || (provider !== 'github' && provider !== '42')) {
			setError('Invalid OAuth callback: missing code or provider.')
			return
		}

		const handledKey = `oauth_handled_${provider}_${code}`
		if (sessionStorage.getItem(handledKey)) {
			return
		}

		const savedState = sessionStorage.getItem(`oauth_state_${provider}`)
		if (!savedState || savedState !== state) {
			setError('Invalid OAuth state. Please try again.')
			return
		}
		sessionStorage.removeItem(`oauth_state_${provider}`)

		sessionStorage.setItem(handledKey, '1')

		oauthLogin(provider, code, state)
			.then(({ token, user }) => {
				login(token, user)
				navigate('/home')
			})
			.catch((err) => {
				sessionStorage.removeItem(handledKey)
				if (err instanceof Error && err.message) {
					setError(err.message)
					return
				}
				setError('OAuth login failed. Please try again.')
			})
	}, [])

	return (
		<div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-[#f0eeff]">
			{error ? (
				<div className="text-center">
					<p className="text-[#e25f5f] mb-4">{error}</p>
					<button
						onClick={() => navigate('/login')}
						className="text-[#e2b96f] underline cursor-pointer"
					>
						{t('login.backToLogin')}
					</button>
				</div>
			) : (
				<p className="text-[#8892a4]">{t('common.loggingIn')}</p>
			)}
		</div>
	)
}

export default OAuthCallbackPage