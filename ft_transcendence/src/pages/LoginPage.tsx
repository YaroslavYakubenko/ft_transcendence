import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { login as apiLogin } from "../api/auth"
import { Link, useNavigate } from "react-router-dom"
import Footer from "../components/Footer"

function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()
	async function handleLogin() {
		setError('')
		if (!email || !password) {
			setError('Fill in all the fields')
			return
		}
		try {
			setIsLoading(true)
			const { token, user } = await apiLogin(email, password)
			login(token, user)
			navigate('/home')
		} catch {
			setError('Invalid username or password')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className="min-h-screen bg-[#0f0f13] flex flex-col">
			<div className="flex-1 flex items-center justify-center">
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-6 w-full max-w-sm">
					<h1 className="text-[#f0eeff] text-[22px] font-medium m-0">
						ft_transcendence
					</h1>
					<div className="mt-6">
						<div className="mb-4">
							<label className="block text-[#8892a4] text-xs mb-1.5">
								Email
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
								Password
							</label>
							<input
								className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-2.5 text-[#f0eeff] text-sm outline-none"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
								placeholder="••••••••"
							/>
						</div>

						<button
							className={`w-full bg-[#e2b96f] text-[#0f0f13] border-none rounded-lg py-2.5 text-sm font-medium ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
							onClick={handleLogin}
							disabled={isLoading}
						>
							{isLoading ? 'Loading...' : 'Enter'}
						</button>
						{error && (
							<p className="text-[#e25f5f] text-xs mt-2">
								{error}
							</p>
						)}
						<p className="text-[#8892a4] text-xs text-center mt-4">
							Don't have an account?{' '}
							<Link to="/register" className="text-[#e2b96f] no-underline">
								Register
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