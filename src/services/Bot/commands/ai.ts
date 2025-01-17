import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { getCachedPromptsJ } from "../../GenAI/prompt/GeneratePrompt";
import {
	clearOCbwoy3ChansHistory,
	SetChatPrompt,
} from "../listeners/OCbwoy3ChanAI";

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
					chatInputRun: "chatInputClear",
				},
				{
					name: "set_character",
					chatInputRun: "chatInputSetPrompt",
				},
			],
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
						.setDescription("Resets OCbwoy3-Chan's chat history")
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_character")
						.setDescription("Sets OCbwoy3-Chan's system prompt")
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

	public async chatInputClear(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		clearOCbwoy3ChansHistory();

		return await interaction.reply({
			content: "Chat history cleared",
			ephemeral: true,
		});
	}

	public async chatInputSetPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		if (interaction.options.getString("prompt")) {
			clearOCbwoy3ChansHistory();
			SetChatPrompt(interaction.options.getString("prompt", true));

			return await interaction.reply({
				content: "Updated prompt, chat history reset",
				ephemeral: false,
			});
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId("ocbwoy3chanai_select_char")
			.setPlaceholder("Make a selection!")
			.addOptions(
				getCachedPromptsJ().map((a) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(a.name)
						.setDescription(a.description)
						.setValue(a.filename);
				})
			);

		const row = new ActionRowBuilder().addComponents(select);

		await interaction.reply({
			content: "Choose a character!",
			components: [row as any],
		});
	}
}

export default SlashCommand;
