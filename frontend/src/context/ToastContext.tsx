import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error'

interface Toast {
	id: number
	message: string
	type: ToastType
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])

	const showToast = useCallback((message: string, type: ToastType = 'success') => {
		const id = nextId++
		setToasts(prev => [...prev, { id, message, type }])
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id))
		}, 3000)
	}, [])

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="fixed top-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
				{toasts.map(toast => (
					<div
						key={toast.id}
						className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg border ${
							toast.type === 'success'
								? 'bg-[#1a1a24] border-green-500 text-green-400'
								: 'bg-[#1a1a24] border-[#e25f5f] text-[#e25f5f]'
						}`}
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	)
}

export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}
