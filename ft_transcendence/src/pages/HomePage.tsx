import { useAuth } from "../context/AuthContext"

function HomePage() {
	const { user, logout } = useAuth()

	return (
		<div style={{
			background: '#0f0f13',
			minHeight: '100vh',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			color: '#f0eeff',
		}}>
			<h1 style={{ fontSize: '28px', fontWeight: 500, margin: '0 0 8px' }}>
				ft_transcendense
			</h1>
			{user && (
				<p style={{ color: '#8892a4', fontSize: '14px', margin: '0 0 2rem' }}>
					Welcome, {user.username}
				</p>
			)}
			<button
				style={{
					background: 'transparent',
					border: '0.5px solid #2e2e40',
					borderRadius: '8px',
					padding: '8px 16px',
					color: '#8892a4',
					fontSize: '13px',
					cursor: 'pointer',
				}}
				onClick={logout}
			>
				Logout
			</button>
		</div>
	)
}

export default HomePage
