import { Command, ContextMenuCommand } from "@sapphire/framework";
import {
	ActionRowBuilder,
	APIEmbed,
	ApplicationCommandType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
	UserContextMenuCommandInteraction,
} from "discord.js";
import { IsWhitelisted } from "../../Database/helpers/DiscordWhitelist";
import { IsAIWhitelisted } from "@db/helpers/AIWhitelist";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder
				.setName("User info")
				.setType(ApplicationCommandType.User)
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
		interaction: UserContextMenuCommandInteraction,
		context: ContextMenuCommand.RunContext
	): Promise<any> {
		const user = interaction.targetUser;

		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});

		const embed: APIEmbed = {
			title: `${user.displayName}`,
			fields: [
				{ name: "Username", value: user.username, inline: false },
				{
					name: "Joined Discord",
					value: `<t:${Math.round(
						user.createdAt.getTime() / 1000
					)}:R>`,
					inline: false,
				},
				{
					name: "Is Whitelisted?",
					value: `${(await IsWhitelisted(user.id)) ? "Yes" : "No"}`,
				},
				{
					name: "Is AI Whitelisted?",
					value: `${(await IsAIWhitelisted(user.id)) ? "Yes" : "No"}`,
				},
			],
			thumbnail: { url: user.displayAvatarURL() },
			color: 0x00ff00,
		};

		const addWhitelistButton = new ButtonBuilder()
			.setLabel("Whitelist")
			.setCustomId(`112-add-wl-${user.id}`)
			.setStyle(ButtonStyle.Primary);

		const removeWhitelistButton = new ButtonBuilder()
			.setLabel("Unwhitelist")
			.setCustomId(`112-remove-wl-${user.id}`)
			.setStyle(ButtonStyle.Danger);

		const aiWhitelistButton = new ButtonBuilder()
			.setLabel("AI")
			.setCustomId(`112-show-ai-wl-${user.id}`)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder().addComponents(
			addWhitelistButton,
			removeWhitelistButton,
			aiWhitelistButton
		);

		await interaction.followUp({
			embeds: [embed],
			components: [row as any],
			ephemeral: false,
		});
	}
}

export default SlashCommand;
