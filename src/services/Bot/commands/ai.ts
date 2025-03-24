import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { getCachedPromptsJ } from "../../GenAI/prompt/GeneratePrompt";
import { clearOCbwoy3ChansHistory } from "../listeners/OCbwoy3ChanAI";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { SetChannelPrompt } from "@db/helpers/AISettings";
import { r } from "112-l10n";

class SlashCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Generative AI Tools",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "reset",
					chatInputRun: "chatInputClear"
				},
				{
					name: "help",
					chatInputRun: "chatInputHelp"
				},
				{
					name: "set_character",
					chatInputRun: "chatInputSetPrompt"
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
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
				.addSubcommand((builder) =>
					builder
						.setName("reset")
						.setDescription(
							"Resets OCbwoy3-Chan's chat history for the current channel"
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("help")
						.setDescription("Displays OCbwoy3-Chan's usage guide")
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_character")
						.setDescription(
							"Sets OCbwoy3-Chan's system prompt in the current channel"
						)
						.addStringOption((option) =>
							option
								.setName("prompt")
								.setDescription("The prompt")
								.setRequired(false)
								.setAutocomplete(true)
						)
				)
		);
	}

	public async chatInputHelp(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		return await interaction.reply({
			content: await r(interaction, "ai:help_msg"),
			ephemeral: true
		});
	}

	public async chatInputClear(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		clearOCbwoy3ChansHistory();
		try {
			chatManager.clearChat(interaction.channelId);
		} catch {}

		return await interaction.reply({
			content: await r(interaction, "ai:chat_clear"),
			ephemeral: true
		});
	}

	public async chatInputSetPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
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

		if (interaction.options.getString("prompt")) {
			await SetChannelPrompt(
				interaction.channelId,
				interaction.options.getString("prompt", true)
			);

			try {
				chatManager.clearChat(interaction.channelId);
			} catch {}

			return await interaction.reply({
				content: await r(interaction, "ai:char_update"),
				ephemeral: false
			});
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId("ocbwoy3chanai_select_char")
			.setPlaceholder(
				await r(interaction, "ai:char_update_select_template")
			)
			.addOptions(
				getCachedPromptsJ()
					.filter((a) => !a.hidden)
					.map((a) => {
						return new StringSelectMenuOptionBuilder()
							.setLabel(a.name)
							.setDescription(a.description)
							.setValue(a.filename);
					})
			);

		const row = new ActionRowBuilder().addComponents(select);

		await interaction.reply({
			content: await r(interaction, "ai:char_update_select"),
			components: [row as any]
		});
	}
}

export default SlashCommand;
