import { container, Listener } from "@sapphire/framework";
import { AttachmentBuilder, ChannelType, Events } from "discord.js";
import { Message } from "discord.js";
import { AIContext, Chat } from "../../GenAI/chat";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { Part } from "@google/generative-ai";
import { RawFile } from "discord.js";
import { IsAIWhitelisted } from "../../Database/db";

let savedChatSession: Chat | null = null;

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

	public run() {
		const { client, logger } = container;

		if (!areGenAIFeaturesEnabled()) {
			logger.warn(
				"GenAI features are disabled, OCbwoy3-Chan AI won't run."
			);
			return;
		}
		logger.info("Started OCbwoy3-Chan AI");

		client.on(Events.MessageCreate, async (m2: Message) => {
			if (m2.author.id === client.user!.id) return;
			if (!m2.mentions.has(client.user!.id)) return;
			if (!(await IsAIWhitelisted(m2.author.id))) return;
			// return await m.reply("> wip");

			// learnlm-1.5-pro-experimental

			const chat = savedChatSession
				? savedChatSession
				: new Chat("learnlm-1.5-pro-experimental", "chat.txt");
			savedChatSession = chat;

			if (m2.content.includes("http")) {
				// if (!m.guild) return;
				void m2.react("⏱️").catch((a) => {});

				// give time for discord's stupid image proxy to do it's job
				await new Promise((a) => setTimeout((b) => a(1), 2000));
			}

			const m = await m2.fetch(true);

			void m.react("💭").catch((a) => {});

			const parts: Array<string | Part> = [];
			const filesToSend: RawFile[] = [];

			for (const attachment of m.attachments.values()) {
				void m.react("💾").catch((a) => {});
				try {
					const response = await fetch(attachment.proxyURL);
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
				} catch {}
			}

			for (const embed of m.embeds) {
				if (embed.data) {
					try {
						if (embed.data.thumbnail) {
							void m.react("🖼️").catch(() => {});
							const response = await fetch(
								embed.data.thumbnail.url
							);
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
						} else if (embed.image?.url) {
							void m.react("🖼️").catch(() => {});
							const response = await fetch(embed.image.url);
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
					} catch {}
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
					response = "> Message too long, sending as file.";
					filesToSend.push({
						contentType: "text/plain",
						name: "message.txt",
						data: response,
					});
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
					files: filesToSend.map((a) => {
						return new AttachmentBuilder(
							Buffer.from(a.data as string)
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
