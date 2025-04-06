import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../../GenAI/gemini";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import {
	GetChannelPrompt,
	GetGuildPrompt
} from "../../../Database/helpers/AISettings";
import { AIContext } from "@ocbwoy3chanai/chat/index";

import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildChannel,
	InteractionContextType
} from "discord.js";
import { Part } from "@google/generative-ai";
import { getDistroNameSync } from "@112/Utility";
import { GetAIModel } from "../../listeners/OCbwoy3ChanAI";
import { r } from "112-l10n";
import { getEmoji } from "@112/EmojiManager";

class AskCommand extends Command {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Asks OCbwoy3-Chan a question",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[]
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall
				)
				.setName("ask")
				.setDescription("Ask OCbwoy3-Chan a question")
				.addStringOption((option) =>
					option
						.setName("message")
						.setDescription("The message to ask")
						.setRequired(true)
				)
				.addAttachmentOption((option) =>
					option
						.setName("vision")
						.setDescription("Include vision analysis")
						.setRequired(false)
				)
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(
				await r(interaction, "ai:not_enabled")
			);
		}

		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});

		const message = interaction.options.getString("message", true);
		const vision = interaction.options.getAttachment("vision", false)
			? true
			: false;

		let prompt = "default";
		const channelPrompt = await GetChannelPrompt(interaction.channelId);
		if (channelPrompt) {
			prompt = channelPrompt;
		} else if (interaction.guildId) {
			const guildPrompt = await GetGuildPrompt(interaction.guildId);
			if (guildPrompt) {
				prompt = guildPrompt;
			}
		}

		const chat = chatManager.getChat(
			interaction.channelId,
			GetAIModel(),
			prompt
		);

		const parts: Array<string | Part> = [message];
		if (vision) {
			for (const attachment of [
				interaction.options.getAttachment("vision", true)
			]) {
				try {
					const response = await fetch(attachment.url);
					const raw = await response.arrayBuffer();
					const mimeType =
						response.headers.get("content-type") || "text/plain";
					parts.push({
						inlineData: {
							data: Buffer.from(raw).toString("base64"),
							mimeType: mimeType
						}
					});
				} catch (e_) {
					console.warn(`Failed to download attachment: ${e_}`);
				}
			}
		}

		const params: AIContext = {
			askingUserId: interaction.user.id,
			chatbotUserId: interaction.client.user!.id,
			currentAiModel: chat.chatModel,
			currentChannel: interaction.channelId,
			currentUserStatusOrWhatTheUserIsDoingListeningToEtc: {
				error: "not usable with /ask command"
			},
			currentServer: interaction.guild
				? {
						name: interaction.guild.name,
						id: interaction.guild.id
				  }
				: null,
			currentChannelM: {
				name: interaction.channel
					? (interaction.channel as GuildChannel).name || null
					: null
			},
			currentDistro: getDistroNameSync(),
			currentWorkingDir: process.cwd()
		};

		let response = "";
		let toolsUsed: string[] = [];
		let err: any = false;
		const rows: any[] = [];
		try {
			[response, toolsUsed] = await chat.generateResponse(parts, params);

			const t: { emoji: string; label: string; id: string }[] = [];

			if (
				toolsUsed.includes("memory.add") ||
				toolsUsed.includes("memory.delete") ||
				toolsUsed.includes("memory.update")
			) {
				t.push({
					emoji: getEmoji("MemoryUpdate"),
					label: await r(interaction, "ai:tools.memory_update"),
					id: "ocbwoy3chan_tool_noop_mem"
				});
			}

			if (
				toolsUsed.includes("atproto.get_posts") ||
				toolsUsed.includes("atproto.profile") ||
				toolsUsed.includes("atproto.did_doc") ||
				toolsUsed.includes("atproto.get_record")
			) {
				t.push({
					emoji: getEmoji("AT_Protocol"),
					label: await r(interaction, "ai:tools.atproto"),
					id: "ocbwoy3chan_tool_noop_atproto"
				});
			}

			if (toolsUsed.includes("ddg.search")) {
				t.push({
					emoji: getEmoji("DuckDuckGo"),
					label: await r(interaction, "ai:tools.duckduckgo"),
					id: "ocbwoy3chan_tool_noop_ddg"
				});
			}

			if (toolsUsed.includes("playwright")) {
				t.push({
					emoji: getEmoji("Playwright"),
					label: await r(interaction, "ai:tools.playwright"),
					id: "ocbwoy3chan_tool_noop_playwright"
				});
			}

			if (
				toolsUsed.includes("mc.status") ||
				toolsUsed.includes("exaroton.credits")
			) {
				t.push({
					emoji:
						getEmoji("Exaroton"),
					label: await r(interaction, "ai:tools.exaroton"),
					id: "ocbwoy3chan_tool_noop_exaroton"
				});
			}

			if (toolsUsed.includes("fandom")) {
				t.push({
					emoji: getEmoji("Fandom"),
					label: await r(interaction, "ai:tools.fandom"),
					id: "ocbwoy3chan_tool_noop_fandom"
				});
			}

			const buttons: ButtonBuilder[] = t.map((tool) =>
				new ButtonBuilder()
					.setLabel(tool.label)
					.setEmoji(tool.emoji)
					.setCustomId(tool.id)
					.setStyle(ButtonStyle.Secondary)
			);

			for (let i = 0; i < buttons.length; i += 4) {
				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					...buttons.slice(i, i + 4)
				);
				rows.push(row);
			}

			if (response.length === 0) throw "Got empty message";
			if (response.trim().replace(/ +/g, " ").length > 2000) {
				return await interaction.followUp({
					content: await r(interaction, "ai:mesage_too_long"),
					files: [
						new AttachmentBuilder(Buffer.from(response), {
							name: "message.txt"
						})
					],
					components: rows as any,
					ephemeral: true
				});
			}
		} catch (e_) {
			err = e_;
			chatManager.clearChat(interaction.channelId);
		}

		if (err !== false) {
			return await interaction.followUp({
				content: `> ${err}`,
				ephemeral: true
			});
		}

		return await interaction.followUp({
			content: response,
			ephemeral: false,
			components: rows as any
		});
	}
}

export default AskCommand;
