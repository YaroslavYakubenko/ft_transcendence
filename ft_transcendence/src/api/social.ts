

export interface UserProfile {
	id: number
	email: string
	username: string
	wins: number
	losses: number
}

export interface Friend extends UserProfile {
	isOnline: boolean
}

export interface ChatMessage {
	id: number
	fromId: number
	toId: number
	text: string
	timestamp: string
}

// Friends API

export async function getFriends(): Promise<Friend[]> {
	return [
		{ id: 2, email: "alice@example.com", username: "alice", wins: 5, losses: 2, isOnline: true },
    	{ id: 3, email: "bob@example.com", username: "bob", wins: 1, losses: 8, isOnline: false },
	]
}

export async function addFriend(userId: number): Promise<void> {
	console.log("addFriend", userId)
}

export async function removeFriend(userId: number): Promise<void> {
	console.log("removeFriend", userId)
}

// Users API

export async function getUserProfile(userId: number): Promise<UserProfile> {
	return {id: userId, email: "player@example.com", username: "player", wins: 3, losses: 3}
}

// Chat API

export async function getMessages(withUserId: number): Promise<ChatMessage[]> {
	return [
		{ id: 1, fromId: withUserId, toId: 1, text: "Hey!", timestamp: "10:00" },                                                                                 
      	{ id: 2, fromId: 1, toId: withUserId, text: "Hello!", timestamp: "10:01" }, 
	]
}

export async function sendMessage(toId: number, text: string): Promise<void> {
	console.log("sendMessage to", toId, ":", text)
}