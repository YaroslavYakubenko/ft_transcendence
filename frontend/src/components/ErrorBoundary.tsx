import { Component, type ReactNode } from "react"

interface Props {
	children: ReactNode
}

interface State {
	hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false }

	static getDerivedStateFromError(): State {
		return { hasError: true }
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-[#f0eeff]">
					<div className="text-center">
						<p className="text-xl font-semibold mb-4">Something went wrong.</p>
						<button
							onClick={() => window.location.href = '/'}
							className="text-[#e2b96f] underline cursor-pointer bg-transparent border-none"
						>
							Go to Home
						</button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}

export default ErrorBoundary
