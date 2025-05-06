import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	Attachment,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	TextDisplayComponent,
	ThumbnailBuilder
} from "discord.js";
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
			withResponse: true
		});
		const diff = Math.round(Date.now() - interaction.createdTimestamp);
		const ping = Math.round(this.container.client.ws.ping); // this shit always ends up being -1 for some stupid fucking reason, or not.
		const mo = await infoCommand.genContent(
			diff.toString(),
			ping.toString(),
			interaction
		);
		const distro = getDistroNameSync();
		const fn =
			distro === "Microsoft Windows"
				? "windows"
				: distro === "macOS"
					? "mac"
					: distro === "NixOS"
						? "nixos"
						: "linux";
		const IMAGE_PATH = join(
			__dirname,
			"..",
			"..",
			"..",
			"..",
			"..",
			"media",
			"icons",
			`${fn}.png`
		);
		// console.log(distro,IMAGE_PATH)
		return await interaction.followUp({
			components: [
				new ContainerBuilder()
					.setAccentColor(0x89b4fa)
					.addSectionComponents(
						new SectionBuilder()
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(
									`# ocbwoy3.dev`
								)
							)
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(mo)
							)
							.setThumbnailAccessory(
								new ThumbnailBuilder().setURL(
									`attachment://${fn}.png`
								)
							)
					)
					.addSeparatorComponents(new SeparatorBuilder())
					.addActionRowComponents(
						new ActionRowBuilder<ButtonBuilder>()
							.addComponents(
								new ButtonBuilder()
									.setLabel("Website")
									.setStyle(ButtonStyle.Link)
									.setURL("https://ocbwoy3.dev")
							)
							.addComponents(
								new ButtonBuilder()
									.setLabel("Discord")
									.setStyle(ButtonStyle.Link)
									.setURL("https://discord.gg/3qddUvkQWJ")
							)
					)
			],
			flags: [MessageFlags.IsComponentsV2],
			files: [
				new AttachmentBuilder(readFileSync(IMAGE_PATH), {
					name: `${fn}.png`
				})
			]
		});
	}
}

export default SlashCommand;
