import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"

function HomePage() {
	const { user } = useAuth()
	const stats = { wins: 0, losses: 0, rank: '-' }
	return (
		<div style={{ background: '#0f0f13', minHeight: '100vh' }}>
			<Navbar />
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: 'calc(100vh - 52px)',
				color: '#f0eeff',
			}}>
				{user && (
					<p style={{ color: '#8892a4', fontSize: '14px', margin: '0 0 2rem' }}>
						Welcome, {user.username}
					</p>
				)}
				<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
					<div style={{ background: '#1a1a24', border: '0.5px solid #2e2e40', borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center' }}>
						<div style={{ fontSize: '24px', fontWeight: 600, color: '#f0eeff' }}>{stats.wins}</div>
						<div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Wins</div>
					</div>
					<div style={{ background: '#1a1a24', border: '0.5px solid #2e2e40', borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center' }}>
						<div style={{ fontSize: '24px', fontWeight: 600, color: '#f0eeff' }}>{stats.losses}</div>
						<div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Losses</div>
					</div>
					<div style={{ background: '#1a1a24', border: '0.5px solid #2e2e40', borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center' }}>
						<div style={{ fontSize: '24px', fontWeight: 600, color: '#f0eeff' }}>{stats.rank}</div>
						<div style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px' }}>Rank</div>
					</div>
				</div>
				<button style={{
					background: '#e2b96f',
					border: 'none',
					borderRadius: '10px',
					padding: '12px 2.5rem',
					color: '#0f0f13',
					fontSize: '15px',
					fontWeight: 600,
					cursor: 'pointer',
				}}>
					▶ Play
				</button>
			</div>
		</div>
	)
}

export default HomePage
