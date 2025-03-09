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
import { r } from "112-l10n";

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
					name: await r(interaction, "generic:wlmenu_joined_discord"),
					value: `<t:${Math.round(
						user.createdAt.getTime() / 1000
					)}:R>`,
					inline: false,
				},
				{
					name: await r(interaction, "generic:wlmenu_is_wl"),
					value: `${(await IsWhitelisted(user.id)) ? await r(interaction, "generic:yes") : await r(interaction, "generic:no")}`,
				},
				{
					name: await r(interaction, "generic:wlmenu_is_ai_wl"),
					value: `${(await IsAIWhitelisted(user.id)) ? await r(interaction, "generic:yes") : await r(interaction, "generic:no")}`,
				},
			],
			thumbnail: { url: user.displayAvatarURL() },
			color: 0x00ff00,
		};

		const addWhitelistButton = new ButtonBuilder()
			.setLabel(await r(interaction, "generic:button_whitelist"))
			.setCustomId(`112-add-wl-${user.id}`)
			.setStyle(ButtonStyle.Primary);

		const removeWhitelistButton = new ButtonBuilder()
			.setLabel(await r(interaction, "generic:button_unwhitelist"))
			.setCustomId(`112-remove-wl-${user.id}`)
			.setStyle(ButtonStyle.Danger);

		const aiWhitelistButton = new ButtonBuilder()
			.setLabel(await r(interaction, "generic:button_ai"))
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
