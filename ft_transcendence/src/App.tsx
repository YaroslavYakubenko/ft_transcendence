import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RegisterPage from './pages/RegisterPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GamePage from './pages/GamePage'
import UserProfilePage from './pages/UserProfilePage'
import FriendsPage from './pages/FriendsPage'
import ChatWidget from './components/ChatWidget'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage/>} />
                    <Route path="/login" element={<LoginPage/>} />
                    <Route path="/register" element={<RegisterPage/>} />
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
                <ChatWidget />
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
