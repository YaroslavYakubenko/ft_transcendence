import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function EditProfilePage() {
	const { user, updateUser } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState(user?.email || '')
	const [username, setUsername] = useState(user?.username || '')
	const [password, setPassword] = useState('')
	const [avatar, setAvatar] = useState<File | null>(null)
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	function handleSubmit() {
		if (password && password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		setError('')
		if (avatar) {
			const reader = new FileReader()
			reader.onload = (e) => {
				updateUser({ username, email, avatarUrl: e.target?.result as string })
				navigate('/profile')
			}
			reader.readAsDataURL(avatar)
		} else {
			updateUser({ username, email })
			navigate('/profile')
		}
	}

	return (
		<div className="bg-[#0f0f13] min-h-screen flex flex-col">
			<Navbar />
			<div className="flex flex-col items-center justify-center flex-1 text-[#f0eeff]">
				<h2 className="text-xl font-semibold mb-8">Edit Profile</h2>
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-8 w-full max-w-sm">
					<label className="block text-sm text-[#8892a4] mb-2">Avatar</label>
					<input
						id="avatar-input"
						type="file"
						accept="image/*"
						onChange={(e) => setAvatar(e.target.files?.[0] || null)}
						className="hidden"
					/>
					<label
						htmlFor="avatar-input"
						className="flex items-center justify-center w-full border border-dashed border-[#2e2e40] rounded-lg py-3 text-[#8892a4] text-sm cursor-pointer hover:border-[#e2b96f] mb-6"
					>
						{avatar ? avatar.name : '+ Upload image'}
					</label>
					<label className="block text-sm text-[#8892a4] mb-2">Username</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Enter username"
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">Email</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">New Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter new password"
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">Confirm Password</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm new password"
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					{error && <p className="text-[#e25f5f] text-sm mb-4">{error}</p>}
					<div className="flex gap-3">
						<button
							onClick={() => navigate('/profile')}
							className="flex-1 bg-transparent border border-[#2e2e40] rounded-lg py-2 text-[#8892a4] text-sm cursor-pointer"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							className="flex-1 bg-[#e2b96f] border-none rounded-lg py-2 text-[#0f0f13] text-sm font-semibold cursor-pointer"
						>
							Save
						</button>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default EditProfilePage