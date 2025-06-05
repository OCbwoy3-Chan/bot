import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../../GenAI/gemini";

import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags
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
				flags: [MessageFlags.Ephemeral]
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(
				await r(interaction, "ai:not_enabled")
			);
		}

		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
			withResponse: true
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
						`# OCbwoy3-Chan Memory Export (${interaction.user.username})
						Here is everything I remember about you! These are **ALL ${m.length} entries** tied to you in the database.
						Some info may not be in the DB, such as information for characters such as ${atob(`RGFya3RydQ==`)}, OCbwoy3 and the insane amount of variations.

						${m.length === 0 ? "Well, I don't have anything about you saved." : "Here is everything I know:"}

						${m.length === 0 ? "" : m.map((a) => `- ${a.memory}`).join("\n")}

						## Here is the same data in a machine-readable format!

						${JSON.stringify(m)}

						## Request Metadata

						Discord ID: ${interaction.user.id}
				metadata.db		Discord Username: ${interaction.user.username}
						Requested in: ${interaction.guildId ? "a Server" : "DMs"} (${interaction.guildId})
						Channel ID: ${interaction.channelId}

						`.replaceAll("\t","")
					),
					{
						name: "memory.txt"
					}
				)
			],
			flags: [MessageFlags.Ephemeral]
		});
	}
}

export default AskCommand;
