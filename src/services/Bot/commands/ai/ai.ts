import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";
import { general } from "../../../../locale/commands";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../../GenAI/gemini";
import { getCachedPromptsJ } from "../../../GenAI/prompt/GeneratePrompt";
import { clearOCbwoy3ChansHistory } from "../../listeners/OCbwoy3ChanAI";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { SetChannelPrompt } from "@db/helpers/AISettings";
import { LanguageId, r } from "112-l10n";
import { getLocaleNow, getLocaleNowOptional } from "services/Bot/bot";
import {
	LazyPaginatedMessage,
	PaginatedMessage,
	PaginatedMessageEmbedFields
} from "@sapphire/discord.js-utilities";

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
				},
				{
					name: "char",
					chatInputRun: "chatInputListCharacterMetadata"
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
							"Resets OCbwoy3-Chan's chat history for the current channel."
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("help")
						.setDescription("Displays OCbwoy3-Chan's usage guide.")
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_character")
						.setDescription(
							"Sets OCbwoy3-Chan's system prompt in the current channel."
						)
						.addStringOption((option) =>
							option
								.setName("prompt")
								.setDescription("The prompt")
								.setRequired(false)
								.setAutocomplete(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("char")
						.setDescription("List a character's metadata.")
						.addStringOption((option) =>
							option
								.setName("prompt")
								.setDescription("The character")
								.setRequired(true)
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
			flags: [MessageFlags.Ephemeral]
		});
	}

	public async chatInputClear(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				flags: [MessageFlags.Ephemeral]
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
			flags: [MessageFlags.Ephemeral]
		});
	}

	public async chatInputSetPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				flags: [MessageFlags.Ephemeral]
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
				content: await r(interaction, "ai:char_update")
			});
		}

		const interactionLang = (await getLocaleNowOptional(
			interaction
		)) as LanguageId;

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
							.setLabel(
								a.metadata_localized?.[interactionLang]?.name ||
									a.name_aichooser ||
									a.name
							)
							.setDescription(
								a.metadata_localized?.[interactionLang]
									?.description || a.description
							)
							.setValue(a.filename);
					})
			);

		const row = new ActionRowBuilder().addComponents(select);

		await interaction.reply({
			content: await r(interaction, "ai:char_update_select"),
			components: [row as any]
		});
	}

	public async chatInputListCharacterMetadata(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				flags: [MessageFlags.Ephemeral]
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(
				await r(interaction, "ai:not_enabled")
			);
		}

		const chat_meta = interaction.options.getString("prompt", true);

		const isOwner =
			interaction.user.id === "486147449703104523" ? true : false;
		const char = getCachedPromptsJ().find((a) => a.filename === chat_meta);

		if (
			!char ||
			char.deprecated ||
			!char.metadata_localized ||
			!char.metadata_language
		) {
			return await interaction.reply({
				content:
					"Oh no! OCbwoy3-Chan doesn't know this character, maybe it doesn't exist?",
				flags: [MessageFlags.Ephemeral]
			});
		}

		if (!isOwner && char.hidden) {
			return await interaction.reply({
				content:
					"Oh no! OCbwoy3-Chan can't display this character, maybe it's owner only?",
				flags: [MessageFlags.Ephemeral]
			});
		}

		const interactionLang = (await getLocaleNow(interaction)) as LanguageId;

		const b = new EmbedBuilder({
			title:
				char.metadata_localized[interactionLang]?.name ||
				char.name_aichooser,
			description:
				char.metadata_localized[interactionLang]?.description_info ||
				char.metadata_localized[interactionLang]?.description ||
				char.description_charinfo ||
				char.description,
			fields: [
				{
					name: await r(interaction, "ai:char_preview.language"),
					value: char.metadata_language
				},
				{
					name: await r(interaction, "ai:char_preview.name"),
					value: char.name
				}
			],
			thumbnail: char.image
				? {
						url: char.image
					}
				: undefined,
			footer: {
				text: `ID: ${char.filename}`
			}
		});

		return await interaction.reply({
			embeds: [b]
		});
	}
}

export default SlashCommand;
