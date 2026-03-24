import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Navbar() {
	const {logout} = useAuth()

	return (
		<nav style={{
			background: '#1a1a24',
			borderBottom: '0.5px solid #2e2e40',
			padding: '0 1.5rem',
			height: '52px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
		}}>
			<Link to="/home" style={{ color: '#f0eeff', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>
				ft_transcendence
			</Link>
			<div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
				<Link to="/profile" style={{ color: '#8892a4', fontSize: '13px', textDecoration: 'none' }}>
					Profile
				</Link>
				<Link to="/leaderboard" style={{ color: '#8892a4', fontSize: '13px', textDecoration: 'none' }}>
					Leaderboard
				</Link>
				<button
					onClick={logout}
					style={{
						background: 'transparent',
						border: '0.5px solid #2e2e40',
						borderRadius: '8px',
						padding: '6px 12px',
						color: '#8892a4',
						fontSize: '13px',
						cursor: 'pointer',
					}}
				>
					Logout
				</button>
			</div>
		</nav>
	)
}

export default Navbar