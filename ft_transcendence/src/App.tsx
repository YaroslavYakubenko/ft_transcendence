import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RegisterPage from './pages/RegisterPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GamePage from './pages/GamePage'
import LobbyPage from './pages/LobbyPage'
import UserProfilePage from './pages/UserProfilePage'
import FriendsPage from './pages/FriendsPage'
import ChatWidget from './components/ChatWidget'
import OAuthCallbackPage from './pages/OAuthCallbackPage'

function AuthentcatedWidgets() {
    const { isLoggedIn } = useAuth()
    if (!isLoggedIn) return null
    return <ChatWidget />
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage/>} />
                    <Route path="/login" element={<LoginPage/>} />
                    <Route path="/register" element={<RegisterPage/>} />
                    <Route path="/oauth/callback" element={<OAuthCallbackPage/>} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage/>} />
                    <Route path="/terms-of-service" element={<TermsOfServicePage/>} />
                    <Route path="/home" element={
                        <ProtectedRoute>
                            <HomePage/>
                        </ProtectedRoute>
					} />
					<Route path="/profile" element={
						<ProtectedRoute>
							<ProfilePage/>
						</ProtectedRoute>
                    } />
					<Route path="/profile/edit" element={
						<ProtectedRoute>
							<EditProfilePage/>
						</ProtectedRoute>
					} />
                    <Route path="/leaderboard" element={
                        <ProtectedRoute>
                            <LeaderboardPage/>
                        </ProtectedRoute>
                    } />
                    <Route path="/game" element={
                        <ProtectedRoute>
                            <GamePage/>
                        </ProtectedRoute>
                    } />
                    <Route path="/lobby" element={
                        <ProtectedRoute>
                            <LobbyPage/>
                        </ProtectedRoute>
                    } />
                    <Route path="/users/:id" element={
                        <ProtectedRoute>
                            <UserProfilePage/>
                        </ProtectedRoute>
                    } />
                    <Route path="/friends" element={
                        <ProtectedRoute>
                            <FriendsPage/>
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFoundPage/>} />
                </Routes>
                <AuthentcatedWidgets />
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
