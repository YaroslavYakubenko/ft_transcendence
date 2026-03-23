import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { register as apiRegister } from "../api/auth"
import { Link } from "react-router-dom"

function RegisterPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { login } = useAuth()
	async function handleRegister() {
		setError('')
		if (!username || !password || !confirmPassword) {
			setError('Fill in all the fields')
			return
		}
		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		try {
			setIsLoading(true)
			const { token, user } = await apiRegister(username, password)
			login(token, user)
		} catch {
			setError('Registration failed')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div style={{
			background: '#0f0f13',
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		}}>
			<div style={{
				background: '#1a1a24',
				border: '0.5px solid #2e2e40',
				borderRadius: '12px',
				padding: '1.5rem',
				width: '100%',
				maxWidth: '380px',
			}}>
				<h1 style={{ color: '#f0eeff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
					Register
				</h1>
				<div style={{ marginTop: '1.5rem' }}>
					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', color: '#8892a4', fontSize: '12px', marginBottom: '6px' }}>
							Login
						</label>
						<input
							style={{
								width: '100%',
								background: '#0f0f13',
								border: '0.5px solid #2e2e40',
								borderRadius: '8px',
								padding: '10px 12px',
								color: '#f0eeff',
								fontSize: '14px',
								boxSizing: 'border-box' as const,
								outline: 'none',
							}}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
							placeholder="username"
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', color: '#8892a4', fontSize: '12px', marginBottom: '6px' }}>
							Password
						</label>
						<input
							style={{
								width: '100%',
								background: '#0f0f13',
								border: '0.5px solid #2e2e40',
								borderRadius: '8px',
								padding: '10px 12px',
								color: '#f0eeff',
								fontSize: '14px',
								boxSizing: 'border-box' as const,
								outline: 'none',
							}}
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
							placeholder="••••••••"
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', color: '#8892a4', fontSize: '12px', marginBottom: '6px' }}>
							Confirm Password
						</label>
						<input
							style={{
								width: '100%',
								background: '#0f0f13',
								border: '0.5px solid #2e2e40',
								borderRadius: '8px',
								padding: '10px 12px',
								color: '#f0eeff',
								fontSize: '14px',
								boxSizing: 'border-box' as const,
								outline: 'none',
							}}
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
							placeholder="••••••••"
						/>
					</div>

					<button
						style={{
							width: '100%',
							background: '#e2b96f',
							color: '#0f0f13',
							border: 'none',
							borderRadius: '8px',
							padding: '10px',
							fontSize: '14px',
							fontWeight: 500,
							cursor: isLoading ? 'not-allowed' : 'pointer',
							opacity: isLoading ? 0.7 : 1,
						}}
						onClick={handleRegister}
						disabled={isLoading}
					>
						{isLoading ? 'Loading...' : 'Register'}
					</button>

					{error && (
						<p style={{ color: '#e25f5f', fontSize: '12px', margin: '8px 0 0 0' }}>
							{error}
						</p>
					)}
					<p style={{ color: '#8892a4', fontSize: '12px', textAlign: 'center', marginTop: '16px' }}>
						Already have an account?{' '}
						<Link to="/login" style={{ color: '#e2b96f', textDecoration: 'none' }}>
							Login
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default RegisterPage