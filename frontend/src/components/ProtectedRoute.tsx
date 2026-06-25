import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isLoggedIn, authLoading } = useAuth()
	if (authLoading) return null
	if (!isLoggedIn) {
		return <Navigate to="/login" />
	}
	return <>{children}</>
}

export default ProtectedRoute