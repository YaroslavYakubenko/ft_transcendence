import { useState } from "react"
import { useAuth } from "../context/AuthContext"

function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const { login } = useAuth()
	function handleLogin() {
		console.log('Login:', username, password)
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
      						cursor: 'pointer',
						}}
						onClick={handleLogin}
					>
						Enter
					</button>
				</div>
			</div>
		</div>
	)
}

export default LoginPage