import { Part } from "@google/generative-ai";
import { container, Listener } from "@sapphire/framework";
import {
	AttachmentBuilder,
	ChannelType,
	Events,
	Message,
	RawFile,
} from "discord.js";
import { getDistroNameSync } from "../../../lib/Utility";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { AIContext, Chat } from "../../GenAI/chat";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { getPrompt } from "../../GenAI/prompt/GeneratePrompt";
import { testAllTools } from "@ocbwoy3chanai/ToolTest";

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

		/*`
		logger.info("Loading NSFWJS model");
		const model = await load();
		*/

		logger.info("Started OCbwoy3-Chan AI, OwO!");

		client.on(Events.MessageCreate, async (m2: Message) => {
			if (m2.author.id === client.user!.id) return;
			if (!m2.mentions.has(client.user!.id)) return;
			if ((await IsAIWhitelisted(m2.author.id)) !== true) return;
			// return await m.reply("> wip");

			// learnlm-1.5-pro-experimental
			// gemini-1.5-flash-8b

			if (m2.author.id === process.env.OWNER_ID!) {
				if (m2.content.startsWith("$OCbwoy3ChanAI_Dev ToolTest")) {
					await m2.reply("testing");
					const testResults = await testAllTools(m2);
					await m2.reply({
						content: "ocbwoy3chanai tool test result",
						files: [
							new AttachmentBuilder(
								Buffer.from(JSON.stringify(testResults)),
								{
									name: "results.json"
								}
							)
						]
					})
					return;
				}
			}

			logger.info(
				`OCbwoy3ChanAIDebug ${m2.author.id} ${AIModel} ${ChatPrompt}`
			);

			if (!savedChatSession) {
				logger.info("OCbwoy3ChanAIDebug newchatsession :3 owo");
			}

			const chat = savedChatSession
				? savedChatSession
				: new Chat(AIModel, ChatPrompt, {
						temperature: 1.3,
				  });
			savedChatSession = chat;

			if (/https?:\/\//.test(m2.content)) {
				// if (!m.guild) return;
				void m2.react("⏱️").catch((a) => {});

				// give time for discord's stupid image proxy to do it's job
				await new Promise((a) => setTimeout((b) => a(1), 3000));
			}

			const m = await m2.fetch(true);

			void m.react("💭").catch((a) => {});

			const parts: Array<string | Part> = [];
			const filesToSend: RawFile[] = [];

			for (const attachment of m.attachments.values()) {
				void m.react("💾").catch((a) => {});
				try {
					const response = await fetch(attachment.url); // discord api sux today
					const raw = await response.arrayBuffer();
					if (raw.byteLength === 0) {
						logger.warn(
							`AIImageHelper: Empty attachment data for ${attachment.proxyURL}`
						);
						continue; // Skip to the next attachment
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
							void m.react("🖼️").catch(() => {});
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
							void m.react("🖼️").catch(() => {});
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
				savedChatSession = null;
			}

			try {
				if (err !== false) {
					return await m.reply("> " + `${err}`);
				}

				return await m.reply({
					content: response,
					/*
					embeds: [
						{
							title: chat.chatModel,
							description:
								`System Prompt: \`${chat.prompt}\`` +
								"\n-# " +
								(toolsUsed.length === 0
									? "No tools used"
									: toolsUsed
											.map((a) => `\`${a}\``)
											.join(", ")),
						},
					],
					*/
					files: filesToSend.map((a) => {
						return new AttachmentBuilder(
							Buffer.from(a.data as string),
							{
								name: a.name,
							}
						);
					}),
				});
			} catch {}
		});
	}
}
/**
 * Clears OCbwoy3-Chan's chat
 */
export function clearOCbwoy3ChansHistory() {
	savedChatSession = null;
}
