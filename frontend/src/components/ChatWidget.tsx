import { useState, useEffect, useRef } from "react"
import { getFriends, getMessages, sendMessage, type Friend, type ChatMessage } from "../api/social"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"


// in react every piece of UI is a function
// you call it and it returns what should be drawn on the screen 
// inside we have helper functions that only this component needs
function ChatWidget() 
{
	const [isOpen, setIsOpen] = useState(false)
	const [friends, setFriends] = useState<Friend[]>([])
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
	const [messages, setMessages] = useState<ChatMessage[]>([])							// setMessages = updates messages; React rerenders when setMessages changes messages

	const [input, setInput] = useState("")
	const bottomRef = useRef<HTMLDivElement>(null)
	const { t } = useTranslation()
	const { token, user, sendChat, lastMessage, friendsUpdate } = useAuth()

	useEffect(() => {
		getFriends(token!).then(setFriends).catch(() => {})
	}, [])

	useEffect(() => {
		if (!friendsUpdate)
			return

		setFriends(prev =>
			prev.map(friend =>
			friend.id === friendsUpdate.user_id
				? { ...friend, isOnline: friendsUpdate.is_online }
				: friend
		)
	)
	}, [friendsUpdate])

	useEffect(() => {
		bottomRef.current?.scrollIntoView()
	}, [messages])

	// react to incoming messages from the persistent WebSocket in AuthContext
	useEffect(() => {
		if (!selectedFriend || !token)
		{
			setMessages([])
			return
		}
		
		getMessages(selectedFriend.id, token)
			.then(function(data) {
				setMessages(data)
			})
			.catch(function(error) {
				console.error("Could not load messages:", error)
				setMessages([])
			})

	}, [selectedFriend, token])				// runs when selectedFriend or token changes

	useEffect(() => {
		
		console.log('lastMessage changed:', lastMessage)  // ← add this temporarily

		if (!lastMessage || !user)
			return

		const isFromFriend = lastMessage.from_user_id === selectedFriend?.id
		const isFromMe = lastMessage.from_user_id === user.id

		if (!isFromFriend && !isFromMe)
			return

		setMessages(prev => [...prev, {
			id: Date.now(),
			fromId: lastMessage.from_user_id,
			toId: lastMessage.from_user_id === user.id ? selectedFriend!.id : user.id,
			text: lastMessage.message,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		}])
	}, [lastMessage])



	function handleSend() 
	{
		console.log("handleSend called", {
			input,
			selectedFriend,
			token,
		})

		if (!input.trim() || !selectedFriend || !token) 
			return

		const text = input.trim()
		sendMessage(selectedFriend.id, text, token)				// HTTP function that sends message to backend
			.then(function(savedMessage){						// the message returned by the backend
				setMessages(prev => [...prev, savedMessage])
				setInput("")

				sendChat(selectedFriend.id, input)				// sends via WebSocket
			})
			.catch(function(error) {
				console.error("Could not send message:", error)
			})
		// setInput("")									// clear the input box
	}

	return (
		<div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 flex flex-col items-end rtl:items-start gap-3">
			{isOpen && (
				<div className="bg-[#1a1a24] border border-[#2e2e40] rounded-xl w-72 h-96 flex flex-col overflow-hidden">
					<div className="px-4 py-3 border-b border-[#2e2e40] flex items-center justify-between">
						{selectedFriend ? (
							<div className="flex items-center gap-2">
								<button onClick={() => setSelectedFriend(null)} className="text-[#8892a4] hover:text-[#f0eeff] cursor-pointer text-xs rtl:rotate-180 inline-block">←</button>
								<span className="text-[#f0eeff] font-semibold text-sm">{selectedFriend.username || selectedFriend.email}</span>
							</div>
						) : (
							<span className="text-[#f0eeff] font-semibold text-sm">{t('chat.title')}</span>
						)}
						<button onClick={() => setIsOpen(false)} className="text-[#8892a4] hover:text-[#f0eeff] cursor-pointer">✕</button>
					</div>

					{!selectedFriend ? (
						<div className="flex-1 overflow-y-auto">
							{friends.length === 0 && <p className="text-[#8892a4] text-sm px-4 py-3">{t('chat.noFriends')}</p>}
							{friends.map(friend => (
								<div key={friend.id} onClick={() => setSelectedFriend(friend)} className="px-4 py-3 flex items-center gap-3 hover:bg-[#2e2e40] cursor-pointer">
									<div className="w-8 h-8 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-sm font-bold">
										{(friend.username || friend.email)[0].toUpperCase()}
									</div>
									<div>
										<p className="text-[#f0eeff] text-sm">{friend.username || friend.email}</p>
										<p className="text-xs text-[#8892a4]">{friend.isOnline ? `🟢 ${t('friends.online')}` : `⚫ ${t('friends.offline')}`}</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<>
							<div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-2">
								{messages.map(msg => (
									<div key={msg.id} className={`flex ${msg.fromId === user?.id ? "justify-end" : "justify-start"}`}>
										<div className={`px-3 py-1.5 rounded-xl text-sm max-w-[80%] ${msg.fromId === user?.id ? "bg-[#e2b96f] text-[#0f0f13]" : "bg-[#2e2e40] text-[#f0eeff]"}`}>
											<p>{msg.text}</p>
											<p className="text-[10px] opacity-60 mt-0.5 text-right">{msg.timestamp}</p>
										</div>
									</div>
								))}
								<div ref={bottomRef} />
							</div>
							<div className="px-3 py-2 border-t border-[#2e2e40] flex gap-2">
								<input
									value={input}
									onChange={e => setInput(e.target.value)}
									onKeyDown={e => e.key === "Enter" && handleSend()}
									placeholder={t('chat.messagePlaceholder')}
									className="flex-1 min-w-0 bg-[#0f0f13] border border-[#2e2e40] rounded-lg px-3 py-1.5 text-sm text-[#f0eeff] outline-none"
								/>
								<button onClick={handleSend} className="text-[#e2b96f] text-sm font-semibold cursor-pointer shrink-0">{t('chat.send')}</button>
							</div>
						</>
					)}
				</div>
			)}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-12 h-12 rounded-full bg-[#e2b96f] flex items-center justify-center text-[#0f0f13] text-xl font-bold cursor-pointer shadow-lg"
			>
				💬
			</button>
		</div>
	)
}

export default ChatWidget