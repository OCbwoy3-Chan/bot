import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../../GenAI/gemini";

import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType
} from "discord.js";
import { prisma } from "@db/db";
import { r } from "112-l10n";

class AskCommand extends Command {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Gets all memories OCbwoy3-Chan knows about you",
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
				.setName("memory")
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
			ephemeral: true,
			fetchReply: true
		});

		const m = await prisma.oCbwoy3ChanAI_UserMemory.findMany({
			where: {
				user: interaction.user.id
			}
		});

		return await interaction.followUp({
			content: await r(interaction, "ai:get_memories_result"),
			files: [
				new AttachmentBuilder(
					Buffer.from(
						m.map((a) => `ID: ${a.id} | ${a.memory}`).join("\n")
					),
					{
						name: "memory.txt"
					}
				)
			],
			ephemeral: true
		});
	}
}

export default AskCommand;
