import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
	const { isLoggedIn } = useAuth()
	if (isLoggedIn) {
		return <Navigate to="/home" />
	}
	return <>{children}</>
}

export default PublicOnlyRoute