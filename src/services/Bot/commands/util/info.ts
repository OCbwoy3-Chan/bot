import { Command } from "@sapphire/framework";
import { ApplicationIntegrationType, Attachment, AttachmentBuilder, EmbedBuilder, InteractionContextType } from "discord.js";
import { infoCommand } from "../../../../locale/commands";
import { getDistroNameSync } from "@112/Utility";
import { join } from "path";
import { readFileSync } from "fs";
import { platform } from "os";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Get the bot's information."
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
		const distro = getDistroNameSync();
		const fn = distro === "Microsoft Windows" ? "windows" : distro === "macOS" ? "mac" : distro === "NixOS" ? "nixos" : "linux"
		const IMAGE_PATH = join(__dirname,"..","..","..","..","..","media","icons",`${fn}.png`)
		console.log(distro,IMAGE_PATH)
		return await interaction.followUp({
			embeds: [
				new EmbedBuilder({
					color: 0x89b4fa,
					title: "ocbwoy3.dev",
					url: "https://ocbwoy3.dev",
					description: mo,
					thumbnail: {
						url: `attachment://${fn}.png`
					}
				})
			],
			files: [
				new AttachmentBuilder(readFileSync(IMAGE_PATH),{name: `${fn}.png`})
			],
			ephemeral: false
		});
	}
}

export default SlashCommand;
