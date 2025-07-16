import { Command, ContextMenuCommand } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageContextMenuCommandInteraction,
	MessageFlags
} from "discord.js";
import { IsWhitelisted } from "../../../Database/helpers/DiscordWhitelist";
import { r } from "112-l10n";
import { triggerOCbwoy3ChanOnMessage } from "services/Bot/listeners/OCbwoy3ChanAI";
import { logger } from "@112/Utility";
import { IsAIWhitelisted, IsChannelAIWhitelisted } from "@db/helpers/AIWhitelist";

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

		await interaction.deferReply({
			withResponse: true,
			flags: [MessageFlags.Ephemeral]
		})

		logger.warn(
			`${interaction.user.username} triggered OCbwoy3-Chan's response manually - (${interaction.targetMessage.channelId}/${interaction.targetMessage.id})`
		);

		triggerOCbwoy3ChanOnMessage(msg, true).catch((a) => console.error(a));

		let warning = "";

		if ((await IsChannelAIWhitelisted(msg.channel.id)) !== true) {
			if ((await IsAIWhitelisted(msg.author.id)) !== true) {
				warning = " This user is not whitelisted. You'll neeed to whitelist this user to automatically trigger OCbwoy3-Chan's response whenever this user pings him or replies to his message."
			};
		} else {
			warning = " This channel is whitelisted."
			if ((await IsAIWhitelisted(msg.author.id)) !== true) {
				warning = " This channel is whitelisted, however OCbwoy3-Chan will not respond to this user pinging him or replying to his messages outside of this channel."
			};

		}

		await interaction.followUp({
			content: `Response triggered!${warning}`,
			flags: [MessageFlags.Ephemeral],
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
