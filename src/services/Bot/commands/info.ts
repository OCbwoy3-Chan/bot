import { Command } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { infoCommand } from "../../../locale/commands";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Get the bot's information.",
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
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});
		const diff = Math.round(Date.now() - interaction.createdTimestamp);
		const ping = Math.round(this.container.client.ws.ping); // this shit always ends up being -1 for some stupid fucking reason, or not.
		const mo = await infoCommand.genContent(
			diff.toString(),
			ping.toString(),
			interaction
		);
		return await interaction.followUp({
			content: mo,
			ephemeral: false
		});
	}
}

export default SlashCommand;
