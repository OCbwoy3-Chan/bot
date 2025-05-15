import { Command, ContextMenuCommand } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageContextMenuCommandInteraction,
	MessageFlags,
} from "discord.js";
import { IsWhitelisted } from "../../../Database/helpers/DiscordWhitelist";
import { r } from "112-l10n";
import { triggerOCbwoy3ChanOnMessage } from "services/Bot/listeners/OCbwoy3ChanAI";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder
				.setName("AI: Trigger Response")
				.setType(ApplicationCommandType.Message as any) // typescript :bruh:
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall
				)
		);
	}

	public override async contextMenuRun(
		interaction: MessageContextMenuCommandInteraction,
		context: ContextMenuCommand.RunContext
	): Promise<any> {
		const msg = interaction.targetMessage;

		if (!(await IsWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "errors:missing_wl"),
				flags: [MessageFlags.Ephemeral]
			});
		}

		triggerOCbwoy3ChanOnMessage(msg).catch(a=>{});

		await interaction.reply({
			content: "ok",
			allowedMentions: {
				parse: [],
				users: [],
				roles: [],
				repliedUser: false
			}
		});
	}
}

export default SlashCommand;
