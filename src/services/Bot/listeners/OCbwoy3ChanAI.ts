import { container, Listener } from "@sapphire/framework";
import { AttachmentBuilder, Events } from "discord.js";
import { Message } from "discord.js";
import { message } from "noblox.js";
import { general } from "../../../locale/commands";
import { Chat } from "../../GenAI/chat";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { Part } from "@google/generative-ai";
import { RawFile } from "discord.js";
import { IsAIWhitelisted } from "../../Database/db";

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

	protected savedChatSession: Chat | null = null;

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

			const chat = this.savedChatSession
				? this.savedChatSession
				: new Chat("gemini-1.5-flash-8b", "chat.txt");
			this.savedChatSession = chat;

			if (!m.guild) return;

			void m.react("💭").catch((a) => {});

			const parts: Array<string | Part> = [];
			const filesToSend: RawFile[] = [];

			for (let idx in m.attachments) {
				void m.react("💾").catch((a) => {});
				try {
					const attachment = m.attachments.get(idx);
					if (!attachment) return;
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

			let response = "";
			let toolsUsed: string[] = [];
			let err: any = false;
			try {
				[response, toolsUsed] = await chat.generateResponse(parts);
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
				this.savedChatSession = null;
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
