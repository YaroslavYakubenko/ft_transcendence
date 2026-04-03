import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { oauthLogin } from "../api/auth"
import { useAuth } from "../context/AuthContext"

function OAuthCallbackPage() {
	const [error, setError] = useState('')
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { login } = useAuth()

	useEffect(() => {
		const code = searchParams.get('code')
		const provider = searchParams.get('state')

		if (!code || !provider) {
			setError('Invalid OAuth callback: missing code or provider.')
			return
		}

		oauthLogin(provider, code)
			.then(({ token, user }) => {
				login(token, user)
				navigate('/home')
			})
			.catch(() => {
				setError('OAuth login failed. Please try again.')
			})
	}, [])

	return (
		<div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-[#f0eeff]">
			{error ? (
				<div className="text-center">
					<p className="text-[#e25f25] mb-4">{error}</p>
					<button
						onClick={() => navigate('/login')}
						className="text-[#e2b96f] underline cursor-pointer"
					>
						Back to login
					</button>
				</div>
			) : (
				<p className="text-[#8892a4]">Logging in...</p>
			)}
		</div>
	)
}

export default OAuthCallbackPage