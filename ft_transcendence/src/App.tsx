import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import { AuthProvider } from './context/AuthContext'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage/>} />
                    <Route path="/login" element={<LoginPage/>} />
                    <Route path="/home" element={<HomePage/>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
