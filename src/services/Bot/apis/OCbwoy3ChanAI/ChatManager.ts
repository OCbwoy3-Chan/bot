import { logger } from "@112/Utility";
import { Chat } from "@ocbwoy3chanai/chat/index";

class ChatManager {
	protected chats: Map<string, { chat: Chat; lastUsed: number }> = new Map();
	protected timeout: number = 10 * 60 * 1000;

	constructor() {
		setInterval(() => this.cleanup(), this.timeout);
	}

	public getChat(channelId: string, model: string, prompt: string): Chat {
		const now = Date.now();
		if (this.chats.has(channelId)) {
			const chatData = this.chats.get(channelId)!;
			chatData.lastUsed = now;
			return chatData.chat;
		} else {
			const chat = new Chat(model, prompt);
			this.chats.set(channelId, { chat, lastUsed: now });
			return chat;
		}
	}

	public clearChat(channelId: string): void {
		this.chats.delete(channelId);
	}

	public clearAllChats(): void {
		this.chats.clear();
	}

	public cleanup(): void {
		const now = Date.now();
		for (const [channelId, chatData] of this.chats.entries()) {
			if (now - chatData.lastUsed > this.timeout) {
				logger.info(`[ChatManager] cleanup ${channelId}`);
				this.chats.delete(channelId);
			}
		}
	}
}

export const chatManager = new ChatManager();
setInterval(() => chatManager.cleanup(), 5000);
