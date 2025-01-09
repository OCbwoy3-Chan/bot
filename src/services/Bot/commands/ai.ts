import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/db";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { clearOCbwoy3ChansHistory } from "../listeners/OCbwoy3ChanAI";

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
			content: "Success",
			ephemeral: true,
		});
	}
}

export default SlashCommand;
