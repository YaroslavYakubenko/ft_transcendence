import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { login as apiLogin } from "../api/auth"
import { Link } from "react-router-dom"

function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { login } = useAuth()
	async function handleLogin() {
		setError('')
		if (!username || !password) {
			setError('Fill in all the fields')
			return
		}
		try {
			setIsLoading(true)
			const { token, user } = await apiLogin(username, password)
			login(token, user)
		} catch {
			setError('Invalid username or password')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div style= {{
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
					ft_transcendense
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
							onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
							onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
						onClick={handleLogin}
						disabled={isLoading}
					>
						{isLoading ? 'Loading...' : 'Enter'}
					</button>
					{error && (
						<p style={{ color: '#e25f5f', fontSize: '12px', marginTop: '8px', margin: '8px 0 0 0' }}>
							{error}
						</p>
					)}
					<p style={{ color: '#8892a4', fontSize: '12px', textAlign: 'center', marginTop: '16px' }}>
						Don't have an account?{' '}
						<Link to="/register" style={{ color: '#e2b96f', textDecoration: 'none' }}>
							Register
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default LoginPage