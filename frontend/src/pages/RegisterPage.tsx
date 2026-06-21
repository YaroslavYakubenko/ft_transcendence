import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { register as apiRegister } from "../api/auth"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useToast } from "../context/ToastContext"

function RegisterPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const hasMinLength = password.length >= 8
	const hasUppercase = /[A-Z]/.test(password)
	const hasDigit = /[0-9]/.test(password)
	const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
	const { login } = useAuth()
	const { t } = useTranslation()
	const { showToast } = useToast()

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
		if (!hasMinLength || !hasUppercase || !hasDigit || !hasSpecial) {
			setError(t('register.passwordWeak'))
			return
		}
		if (password.trim() !== confirmPassword.trim()) {
			setError(t('register.passwordsDoNotMatch'))
			return
		}
		try {
			setIsLoading(true)
			const { token, user } = await apiRegister(email, password)
			showToast(t('toast.registered'))
			login(token, user)
		} catch (err) {
			if (err instanceof Error && err.message) {
				setError(err.message)
			} else {
				setError(t('register.registrationFailed'))
			}
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
								<div className="relative">
									<input
										className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
							<div className="mb-4">
								{[
									{ check: hasMinLength, label: t('register.req.minLength') },
									{ check: hasUppercase, label: t('register.req.uppercase') },
									{ check: hasDigit, label: t('register.req.digit') },
									{ check: hasSpecial, label: t('register.req.special') },
								].map((req, i) => (
									<p key={i} className={`text-xs m-0 mb-1 ${req.check ? "text-green-400" : "text-[#e25f5f]"}`}>
										{req.check ? '✓' : '✗'} {req.label}
									</p>
								))}
							</div>
							<div className="mb-4">
								<label className="block text-[#8892a4] text-xs mb-1.5">
									{t('register.confirm')}
								</label>
								<div className="relative">
									<input
										className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
										type={showConfirm ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
										placeholder="••••••••"
									/>
									<button
										type="button"
										onClick={() => setShowConfirm(!showConfirm)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-[#f0eeff] bg-transparent border-none cursor-pointer p-0"
									>
										{showConfirm ? (
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
								{confirmPassword.length > 0 && (
									<p className={`text-xs mt-1 m-0 ${password.trim() === confirmPassword.trim() ? "text-green-400" : "text-[#e25f5f]"}`}>
										{password.trim() === confirmPassword.trim() ? `✓ ${t('register.passwordsMatch')}` : `✗ ${t('register.passwordsDoNotMatch')}`}
									</p>
								)}
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