import { Part } from "@google/generative-ai";
import { container, Listener } from "@sapphire/framework";
import {
	AttachmentBuilder,
	ChannelType,
	Events,
	Message,
	RawFile,
} from "discord.js";
import { getDistroNameSync } from "@112/Utility";
import { IsAIWhitelisted } from "@db/helpers/AIWhitelist";
import { AIContext, Chat } from "@ocbwoy3chanai/chat/index";
import { areGenAIFeaturesEnabled } from "@ocbwoy3chanai/gemini";
import { getPrompt } from "@ocbwoy3chanai/prompt/GeneratePrompt";
import { testAllTools } from "@ocbwoy3chanai/ToolTest";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { GetChannelPrompt, GetGuildPrompt } from "../../Database/helpers/AISettings";

let savedChatSession: Chat | null = null;

let ChatPrompt = "ocbwoy3-chan";
let AIModel = "gemini-1.5-flash";

export function SetChatPrompt(p: string) {
	if (!getPrompt(p)) throw "Prompt doesn't exist";
	ChatPrompt = p;
	savedChatSession = null;
}

export function SetAIModel(p: string) {
	AIModel = p;
	savedChatSession = null;
}

const staticAIContext = {
	currentDistro: getDistroNameSync(),
	currentWorkingDir: process.cwd(),
};

export class OCbwoy3ChanAI extends Listener {
	public constructor(
		context: Listener.LoaderContext,
		options: Listener.Options
	) {
		super(context, {
			...options,
			once: true,
			event: "ready",
		});
	}

	public async run() {
		const { client, logger } = container;

		if (!areGenAIFeaturesEnabled()) {
			logger.warn(
				"GenAI features are disabled, OCbwoy3-Chan AI won't run."
			);
			return;
		}

		logger.info("Started OCbwoy3-Chan AI, OwO!");

		client.on(Events.MessageCreate, async (m2: Message) => {
			if (m2.author.id === client.user!.id) return;
			if (!m2.mentions.has(client.user!.id)) return;
			if ((await IsAIWhitelisted(m2.author.id)) !== true) return;

			logger.info(
				`OCbwoy3ChanAIDebug ${m2.author.id} ${AIModel} ${ChatPrompt}`
			);

			if (!savedChatSession) {
				logger.info("OCbwoy3ChanAIDebug newchatsession :3 owo");
			}

			let prompt = ChatPrompt;
			const channelPrompt = await GetChannelPrompt(m2.channel.id);
			if (channelPrompt) {
				prompt = channelPrompt;
			} else if (m2.guild) {
				const guildPrompt = await GetGuildPrompt(m2.guild.id);
				if (guildPrompt) {
					prompt = guildPrompt;
				}
			}

			const chat = chatManager.getChat(m2.channel.id, AIModel, prompt);

			if (/https?:\/\//.test(m2.content)) {
				void m2.react("⏱️").catch((a) => { });

				await new Promise((a) => setTimeout((b) => a(1), 3000));
			}

			const m = await m2.fetch(true);

			void m.react("💭").catch((a) => { });

			const parts: Array<string | Part> = [];
			const filesToSend: RawFile[] = [];

			for (const attachment of m.attachments.values()) {
				void m.react("💾").catch((a) => { });
				try {
					const response = await fetch(attachment.url);
					const raw = await response.arrayBuffer();
					if (raw.byteLength === 0) {
						logger.warn(
							`AIImageHelper: Empty attachment data for ${attachment.proxyURL}`
						);
						continue;
					}
					const mimeType =
						response.headers.get("content-type") || "text/plain";
					parts.push({
						inlineData: {
							data: Buffer.from(raw).toString("base64"),
							mimeType: mimeType.replace(
								"application/octet-stream",
								"text/plain"
							),
						},
					});
				} catch (e_) {
					logger.warn(
						`AIImageHelper: Failed to dl attachment: ${e_}`
					);
				}
			}

			async function refetchPlz(
				check: (mt: Message) => boolean
			): Promise<Message> {
				if (check(m) === false) return m;
				let i = 0;
				while (i < 10) {
					i++;
					console.log(`fetch iteration ${i} of 10`);
					await new Promise((a) => setTimeout((b) => a(1), 250));
					const z = await m2.fetch(true);
					if (check(z) === true) return z;
				}
				throw "Check failed after 10 iterations 250ms";
			}

			for (const embed of m.embeds) {
				if (embed.data) {
					try {
						if (embed.data.thumbnail) {
							void m.react("🖼️").catch(() => { });
							const response = await fetch(
								embed.data.thumbnail.proxy_url!
							);
							const raw = await response.arrayBuffer();
							const mimeType =
								response.headers.get("content-type") ||
								"text/plain";
							parts.push({
								inlineData: {
									data: Buffer.from(raw).toString("base64"),
									mimeType: mimeType.replace(
										"application/octet-stream",
										"text/plain"
									),
								},
							});
						} else if (embed.image?.url) {
							void m.react("🖼️").catch(() => { });
							const response = await fetch(embed.image.proxyURL!);
							const raw = await response.arrayBuffer();
							const mimeType =
								response.headers.get("content-type") ||
								"application/octet-stream";
							parts.push({
								inlineData: {
									data: Buffer.from(raw).toString("base64"),
									mimeType: mimeType,
								},
							});
						}
					} catch (e_) {
						logger.warn(
							`AIImageHelper: Failed to dl proxied embed: ${e_}`
						);
					}
				}
			}

			if (m.content.length !== 0) {
				parts.push(m.content as string);
			} else {
				parts.push("[no comment]");
			}

			if (m.channel.type === ChannelType.GuildText) {
				void m.channel.sendTyping();
			}

			const params: AIContext = {
				askingUserId: m.author.id,
				chatbotUserId: m.client.user!.id,
				currentAiModel: chat.chatModel,
				currentChannel: m.channel.id,
				currentUserStatusOrWhatTheUserIsDoingListeningToEtc: m.member
					? m.member.presence?.toJSON()
					: "avaiable only in servers",
				currentServer: m.guild
					? {
						name: m.guild.name,
						id: m.guild.id,
					}
					: null,
				currentChannelM: {
					name: m.channel.isDMBased() ? null : m.channel.name,
				},
				...staticAIContext,
			};

			let response = "";
			let toolsUsed: string[] = [];
			let err: any = false;
			try {
				[response, toolsUsed] = await chat.generateResponse(
					parts,
					params
				);
				if (response.length === 0) throw "Got empty message";
				if (response.trim().replace(/ +/g, " ").length > 2000) {
					filesToSend.push({
						contentType: "text/plain",
						name: "message.txt",
						data: response,
					});
					response = "> Message too long, sending as file.";
				}
			} catch (e_) {
				err = e_;
				chatManager.clearChat(m.channelId);
			}

			try {
				if (err !== false) {
					return await m.reply("> " + `${err}`);
				}

				return await m.reply({
					content: response,
					files: filesToSend.map((a) => {
						return new AttachmentBuilder(
							Buffer.from(a.data as string),
							{
								name: a.name,
							}
						);
					}),
				});
			} catch { }
		});
	}
}

/**
 * Clears OCbwoy3-Chan's chat
 */
export function clearOCbwoy3ChansHistory() {
	savedChatSession = null;
}
