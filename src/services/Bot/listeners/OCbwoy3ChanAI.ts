import { Part } from "@google/generative-ai";
import { container, Listener } from "@sapphire/framework";
import {
	AttachmentBuilder,
	ChannelType,
	ContainerBuilder,
	Events,
	Message,
	MessageFlags,
	RawFile,
	TextDisplayBuilder
} from "discord.js";
import {
	IsAIWhitelisted,
	IsChannelAIWhitelisted
} from "@db/helpers/AIWhitelist";
import { AIContext, Chat } from "@ocbwoy3chanai/chat/index";
import { areGenAIFeaturesEnabled } from "@ocbwoy3chanai/gemini";
import { getPrompt } from "@ocbwoy3chanai/prompt/GeneratePrompt";
import { testAllTools, testSingleTool } from "@ocbwoy3chanai/ToolTest";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import {
	GetChannelPrompt,
	GetGuildPrompt
} from "../../Database/helpers/AISettings";
import { getToolMetas } from "@ocbwoy3chanai/chat/tools";
import { exec } from "child_process";
import { r } from "112-l10n";
import { sep } from "path";
import { logger } from "@112/Utility";
import { client } from "../bot";

let savedChatSession: Chat | null = null;

let ChatPrompt = `ocbwoy3_chan${sep}default`;
let AIModel = "gemini-2.5-flash-latest";

const BlacklistedMentions = /@(?:here|everyone)/;

export function SetChatPrompt(p: string) {
	if (!getPrompt(p)) throw "Prompt doesn't exist";
	ChatPrompt = p;
	savedChatSession = null;
}

export function SetAIModel(p: string) {
	AIModel = p;
	savedChatSession = null;
}

export function GetAIModel() {
	return AIModel;
}

export async function triggerOCbwoy3ChanOnMessage(
	m2: Message,
	isManualTrigger: boolean = false
) {
	if (isManualTrigger === false) {
		// console.log(m2.channel.isDMBased() ? 'dms' : m2.channel.name)
		if (m2.author.id === client.user!.id) return;
		if (!m2.mentions.has(client.user!.id)) return;
		if (BlacklistedMentions.test(m2.content)) return;
		if (!m2.channel.isDMBased()) {
			// if (!m2.channel.permissionsFor(client.user!.id)?.has("SendMessages")) return;
		}
		if ((await IsChannelAIWhitelisted(m2.channel.id)) !== true) {
			if ((await IsAIWhitelisted(m2.author.id)) !== true) return;
		}

		if (m2.author.id === process.env.OWNER_ID!) {
			if (m2.content.startsWith("$OCbwoy3ChanAI_Dev Update")) {
				await m2.reply("ok");
				exec("./upd.sh");
				return;
			}
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
				});
				return;
			}
			if (m2.content.startsWith("$OCbwoy3ChanAI_Dev T ")) {
				await m2.reply("testing");
				const testResults = await testSingleTool(m2.content.replaceAll("$OCbwoy3ChanAI_Dev T ",""), m2);
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
				});
				return;
			}
			if (m2.content.startsWith("$OCbwoy3ChanAI_Dev Tools")) {
				const tools = await getToolMetas();
				const tString = tools
					.map((a) => {
						let b: string[] = [];
						if (a.parameters) {
							b = [
								a.parameters.description ||
									"No description provided",
								`Type: ${a.parameters.type}`,
								`Required: ${a.parameters.required?.join(
									", "
								)}`,
								Object.entries(a.parameters!.properties!)
									.map(([name, data]) => {
										return `Param: ${name} - ${JSON.stringify(
											data
										)}`;
									})
									.join("\n")
							];
						}
						return `${a.name} - ${a.description}\n${b.join("\n")}`;
					})
					.join("\n\n");
				await m2.reply({
					content: "ok",
					files: [
						new AttachmentBuilder(Buffer.from(tString), {
							name: "tools.txt"
						})
					]
				});
				return;
			}
			if (m2.content.startsWith("$OCbwoy3ChanAI_Dev Prompt")) {
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
				await m2.reply({
					content: `${m2.author.id} ${AIModel} ${prompt}`,
					files: [
						new AttachmentBuilder(
							Buffer.from(getPrompt(prompt)?.toString() || ""),
							{
								name: "system.txt"
							}
						)
					]
				});
				return;
			}
		}
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

	logger.info(
		`[OCbwoy3-Chan AI Debugger] Author: ${m2.author.id} Model: ${AIModel} Character: ${ChatPrompt}`
	);

	const chat = chatManager.getChat(m2.channel.id, AIModel, prompt);

	if (/https?:\/\//.test(m2.content)) {
		void m2.react("⏱️").catch((a) => {});

		await new Promise((a) => setTimeout((b) => a(1), 3000));
	}

	const m = await m2.fetch(true);

	void m.react("💭").catch((a) => {});

	const parts: Array<string | Part> = [];
	const filesToSend: RawFile[] = [];

	// i know damn well discord's api wont allow empty shit from normal users without embeds and crap
	if (m.content.length !== 0) {
		if (
			/^ +?\<\@\!?[0-9]+\> +?$/i.test(m.content) &&
			m.content.includes(client.user!.id)
		) {
			parts.push(
				`<@!${client.user!.id}> Refer to the following content:`
			);
		} else {
			parts.push(m.content as string);
		}
	} else {
		parts.push("Refer to the following content:");
	}

	for (const attachment of m.attachments.values()) {
		void m.react("💾").catch((a) => {});
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
					)
				}
			});
		} catch (e_) {
			logger.warn(`AIImageHelper: Failed to dl attachment: ${e_}`);
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
						response.headers.get("content-type") || "text/plain";
					parts.push({
						inlineData: {
							data: Buffer.from(raw).toString("base64"),
							mimeType: mimeType.replace(
								"application/octet-stream",
								"text/plain"
							)
						}
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
							mimeType: mimeType
						}
					});
				}
			} catch (e_) {
				logger.warn(`AIImageHelper: Failed to dl proxied embed: ${e_}`);
			}
		}
	}

	if (m.channel.type === ChannelType.GuildText) {
		void m.channel.sendTyping().catch((a) => {});
	}

	const params: AIContext = {
		askingUserId: m.author.id,
		chatbotUserId: m.client.user!.id,
		currentAiModel: chat.chatModel,
		currentChannel: m.channel.id,
		currentUserStatusOrWhatTheUserIsDoingListeningToEtc: m.member
			? m.member.presence?.toJSON()
			: { error: "avaiable only in servers" },
		currentServer: m.guild
			? {
					name: m.guild.name,
					id: m.guild.id
			  }
			: null,
		currentChannelM: {
			name: m.channel.isDMBased() ? null : m.channel.name
		},
		embeds: m.embeds.map((a) => a.toJSON())
	};

	let response = "";
	let toolsUsed: string[] = [];
	let err: any = false;
	try {
		[response, toolsUsed] = await chat.generateResponse(parts, params);
		if (toolsUsed.length !== 0) {
			void m.react("⚙️").catch((a) => {});
		}
		if (
			toolsUsed.includes("memory.add") ||
			toolsUsed.includes("memory.delete") ||
			toolsUsed.includes("memory.update")
		) {
			void m.react("📓").catch((a) => {});
		}
		if (response.length === 0) throw "Got empty message";
		if (response.trim().replace(/ +/g, " ").length > 2000) {
			filesToSend.push({
				contentType: "text/plain",
				name: "message.txt",
				data: response
			});
			response = await r(m2, "ai:message_too_long");
		}
	} catch (e_) {
		err = e_;
		chatManager.clearChat(m.channelId);
	}

	try {
		if (err !== false) {
			let loc = "ai:ohno";
			if (`${err}`.startsWith("PromptFeedback,")) {
				loc = "ai:ohno_google";
				err = `${err}`.replaceAll(`PromptFeedback,`, "");
			}
			if (`${err}`.startsWith("NoResult,")) {
				loc = "ai:ohno";
				err = `${err}`.replaceAll(`NoResult,`, "");
			}
			if (`${err}`.includes("429 Too Many Requests")) {
				loc = "ai:ohno_google";
				err = `Google rate-limited us. SLOW DOWN WITH THE MESSAGES.`;
			}
			return await m.reply({
				components: [
					new ContainerBuilder()
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`## ${await r(m2, loc)}`
							)
						)
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								"```\n" + `${err}` + "\n```"
							)
						)
				],
				flags: [MessageFlags.IsComponentsV2]
			});
		}

		return await m.reply({
			content: response,
			allowedMentions: {
				parse: ["users"]
			},
			files: filesToSend.map((a) => {
				return new AttachmentBuilder(Buffer.from(a.data as string), {
					name: a.name
				});
			})
		});
	} catch {}
}

export class OCbwoy3ChanAI extends Listener {
	public constructor(
		context: Listener.LoaderContext,
		options: Listener.Options
	) {
		super(context, {
			...options,
			once: true,
			event: "ready"
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
			await triggerOCbwoy3ChanOnMessage(m2);
		});
	}
}

/**
 * Clears OCbwoy3-Chan's chat
 */
export function clearOCbwoy3ChansHistory() {
	savedChatSession = null;
}
