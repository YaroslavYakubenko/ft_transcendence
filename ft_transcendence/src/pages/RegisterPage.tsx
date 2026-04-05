import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { register as apiRegister } from "../api/auth"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function RegisterPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { login } = useAuth()
	const { t } = useTranslation()

	async function handleRegister() {
		setError('')
		if (!email || !password || !confirmPassword) {
			setError(t('login.fillAllFields'))
			return
		}
		if (!email.includes('@') || !email.includes('.')) {
			setError(t('login.invalidEmail'))
			return
		}
		if (password.length < 8) {
			setError(t('login.passwordTooShort'))
			return
		}
		if (password !== confirmPassword) {
			setError(t('register.passwordsDoNotMatch'))
			return
		}
		try {
			setIsLoading(true)
			const { token, user } = await apiRegister(email, password)
			login(token, user)
		} catch {
			setError(t('register.registrationFailed'))
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-sm">
						<h1 className="text-[#f0eeff] text-[22px] font-medium m-0">
							{t('register.title')}
						</h1>
						<div className="mt-6">
							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('register.email')}
								</label>
								<input
									className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
									placeholder="email@example.com"
								/>
							</div>

							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('register.password')}
								</label>
								<input
									className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
									placeholder="••••••••"
								/>
							</div>

							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('register.confirm')}
								</label>
								<input
									className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
									placeholder="••••••••"
								/>
							</div>

							<button
								className={`w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
								onClick={handleRegister}
								disabled={isLoading}
							>
								{isLoading ? t('common.loading') : t('register.submit')}
							</button>

							{error && (
								<p className="text-[#e25f5f] text-xs mt-2">
									{error}
								</p>
							)}
							<p className="text-[#8892a4] text-xs text-center mt-4">
								{t('register.hasAccount')}{' '}
								<Link to="/login" className="text-[#e2b96f] no-underline">
									{t('register.login')}
								</Link>
							</p>
						</div>
					</div>
				</div>
			<Footer />
		</div>
	)
}

export default RegisterPage