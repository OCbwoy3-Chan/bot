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

		client.on(Events.MessageCreate, async (m: Message) => {
			if (m.author.id === client.user!.id) return;
			if (!m.mentions.has(client.user!.id)) return;
			if (!(await IsAIWhitelisted(m.author.id))) return;
			// return await m.reply("> wip");

			// learnlm-1.5-pro-experimental

			const chat = savedChatSession
				? savedChatSession
				: new Chat("learnlm-1.5-pro-experimental", "chat.txt");
			savedChatSession = chat;

			// if (!m.guild) return;

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

