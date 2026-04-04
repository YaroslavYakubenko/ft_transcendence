import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useTranslation } from "react-i18next"

function EditProfilePage() {
	const { user, updateUser, deleteAccount } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState(user?.email || '')
	const [username, setUsername] = useState(user?.username || '')
	const [password, setPassword] = useState('')
	const [avatar, setAvatar] = useState<File | null>(null)
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const { t } = useTranslation()

	function handleSubmit() {
		if (password && password !== confirmPassword) {
			setError(t('register.passwordsDoNotMatch'))
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
				<h2 className="text-xl font-semibold mb-8">{t('profile.editProfile')}</h2>
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl p-8 w-full max-w-sm">
					<div className="flex justify-center mb-6">
						{avatarPreview ? (
							<img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
						) : (
							<div className="w-20 h-20 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-2xl font-bold">
								{(user?.username || user?.email || '?')[0].toUpperCase()}
							</div>
						)}
					</div>
					<label className="block text-sm text-[#8892a4] mb-2">{t('profile.avatar')}</label>
					<input
						id="avatar-input"
						type="file"
						accept="image/*"
						onChange={(e) => {
							const file = e.target.files?.[0] || null
							setAvatar(file)
							if (file) setAvatarPreview(URL.createObjectURL(file))
						}}
						className="hidden"
					/>
					<label
						htmlFor="avatar-input"
						className="flex items-center justify-center w-full border border-dashed border-[#2e2e40] rounded-lg py-3 text-[#8892a4] text-sm cursor-pointer hover:border-[#e2b96f] mb-6"
					>
						{avatar ? avatar.name : t('profile.uploadImage')}
					</label>
					<label className="block text-sm text-[#8892a4] mb-2">{t('profile.username')}</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder={t('profile.usernamePlaceholder')}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">{t('login.email')}</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">{t('profile.newPassword')}</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={t('profile.newPasswordPlaceholder')}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					<label className="block text-sm text-[#8892a4] mb-2">{t('register.confirm')}</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder={t('profile.confirmPasswordPlaceholder')}
						className="w-full bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-4 py-2 text-[#f0eeff] text-sm outline-none mb-6"
					/>
					{error && <p className="text-[#e25f5f] text-sm mb-4">{error}</p>}
					<div className="flex gap-3">
						<button
							onClick={() => navigate('/profile')}
							className="flex-1 bg-transparent border border-[#2e2e40] rounded-lg py-2 text-[#8892a4] text-sm cursor-pointer hover:border-[#e25f5f]"
						>
							{t('profile.cancel')}
						</button>
						<button
							onClick={handleSubmit}
							className="flex-1 bg-[#e2b96f] border-none rounded-lg py-2 text-[#0f0f13] text-sm font-semibold cursor-pointer"
						>
							{t('profile.saveChanges')}
						</button>
					</div>
					<div className="mt-6 pt-6 border-t border-[#2e2e40]">
						{!showDeleteConfirm ? (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="w-full bg-transparent border border-[#e25f5f] rounded-lg py-2 text-[#e25f5f] text-sm cursor-pointer hover:bg-[#e25f5f] hover:text-white"
							>
								{t('profile.deleteAccount')}
							</button>
						) : (
							<div className="flex flex-col gap-3">
								<p className="text-[#8892a4] text-sm text-center">{t('profile.deleteAccountConfirm')}</p>
								<div className="flex gap-3">
									<button
										onClick={() => setShowDeleteConfirm(false)}
										className="flex-1 bg-transparent border border-[#2e2e40] rounded-lg py-2 text0[#8892a4] text-sm cursor-pointer hover:border-[#e2b96f]"
									>
										{t('profile.deleteAccountCancel')}
									</button>
									<button
										onClick={deleteAccount}
										className="flex-1 bg-[#e25f5f] border-none rounded-lg py-2 text-white text-sm font-semibold cursor-pointer"
									>
										{t('profile.deleteAccountConfirmBtn')}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

export default EditProfilePage