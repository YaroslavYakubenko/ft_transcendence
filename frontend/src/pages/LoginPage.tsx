import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { buildOAuthUrl, getOAuthState, login as apiLogin, type OAuthProvider } from "../api/auth"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()
	const { t } = useTranslation()

	async function handleLogin() {
		setError('')
		if (!email || !password) {
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
		try {
			setIsLoading(true)
			const { token, user } = await apiLogin(email, password)
			login(token, user)
			navigate('/home')
		} catch (err) {
			if (err instanceof Error && err.message) {
				setError(err.message)
			} else {
				setError(t('login.invalidCredentials'))
			}
		} finally {
			setIsLoading(false)
		}
	}

	async function handleOAuth(provider: OAuthProvider) {
		setError('')
		try {
			const state = await getOAuthState(provider)
			window.location.href = buildOAuthUrl(provider, state)
		} catch (err) {
			if (err instanceof Error && err.message) {
				setError(err.message)
			} else {
				setError('Failed to start OAuth flow. Please try again.')
			}
		}
	}
	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-sm">
						<h1 className="text-[#f0eeff] text-[22px] font-medium m-0">
							ft_transcendence
						</h1>
						<div className="mt-6">
							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('login.email')}
								</label>
								<input
									className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
									placeholder="email@example.com"
								/>
							</div>

							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('login.password')}
								</label>
								<div className="relative">
									<input
										className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none pr-10"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
										placeholder="••••••••"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-[#f0eeff] bg-transparent border-none cursor-pointer p-0"
									>
										{showPassword ? (
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
												<line x1="1" y1="1" x2="23" y2="23"/>
											</svg>
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
												<circle cx="12" cy="12" r="3"/>
											</svg>
										)}
									</button>
								</div>
							</div>

							<button
								className={`w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
								onClick={handleLogin}
								disabled={isLoading}
							>
								{isLoading ? t('common.loading') : t('login.submit')}
							</button>
							{error && (
								<p className="text-[#e25f5f] text-xs mt-2">
									{error}
								</p>
							)}
							<div className="flex items-center gap-3 my-4">
								<div className="flex-1 h-px bg-[#2e2e40]" />
								<span className="text-[#8892a4] text-xs">{t('login.or')}</span>
								<div className="flex-1 h-px bg-[#2e2e40]" />
							</div>
							<button
								onClick={() => handleOAuth('github')}
								className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg py-2.5 text-sm text-[#f0eeff] cursor-pointer hover:border-[#e2b96f] mb-2 flex items-center justify-center gap-2"
							>
								<svg width="18" height="18" viewBox="0 0 98 96" fill="currentColor">                                                                                          
								    <path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 
								2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378      
								14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 
								4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038     
								3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 
								2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
								</svg> {t('login.loginWithGithub')}
							</button>
							<button
								onClick={() => handleOAuth('42')}
								className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg py-2.5 text-sm text-[#f0eeff] cursor-pointer hover:border-[#e2b96f] mb-2 flex items-center justify-center gap-2"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">                                                                                          
    								<path d="M19.581 16.851H24v-4.439ZM24 3.574h-4.419v4.42l-4.419 4.418v4.44h4.419v-4.44L24 7.993Zm-4.419 0h-4.419v4.42zm-6.324                              
								8.838H4.419l8.838-8.838H8.838L0 12.412v3.595h8.838v4.419h4.419z"/>                                                                                            
								</svg> {t('login.loginWith42')}
							</button>
							<p className="text-[#8892a4] text-xs text-center mt-4">
								{t('login.noAccount')}{' '}
								<Link to="/register" className="text-[#e2b96f] no-underline">
									{t('login.register')}
								</Link>
							</p>
						</div>
					</div>
				</div>
			<Footer />
		</div>
	)
}

export default LoginPage