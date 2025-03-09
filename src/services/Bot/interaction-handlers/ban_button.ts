import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { GetUserDetails } from "../../../lib/roblox";
import { IsWhitelisted } from "../../Database/helpers/DiscordWhitelist";
import { GetBanData, UnbanUser } from "../../Database/helpers/RobloxBan";
import { r } from "112-l10n";

export class MessageComponentHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.MessageComponent,
		});
	}

	public override parse(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		// console.log("ban",(/^112\-(confirm\-)?unban\-/.test(interaction.customId)),interaction.customId)
		if (/^112\-(confirm\-)?unban\-/.test(interaction.customId))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-confirm-unban-")) {
			const userid = interaction.customId.replace(
				"112-confirm-unban-",
				""
			);

			await interaction.deferReply({
				ephemeral: false,
				fetchReply: true
			});

			const ru = await GetUserDetails(parseInt(userid));

			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: await r(interaction, "errors:missing_wl"),
					ephemeral: true,
				});
			}

			try {
				await UnbanUser(userid);
			} catch (e_) {
				return await interaction.followUp({
					content: `> ${e_}`,
					ephemeral: true,
				});
			}

			return await interaction.followUp({
				content: await r(interaction, "mod:unban_success", { user: `[${ru.displayName}](https://fxroblox.com/users/${userid})` }),
				ephemeral: false,
			});
		}

		if (interaction.customId.startsWith("112-unban-")) {
			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: await r(interaction, "errors:missing_wl"),
					ephemeral: true,
				});
			}

			await interaction.deferReply({
				ephemeral: false,
				fetchReply: true
			});

			const userid = interaction.customId.replace("112-unban-", "");

			if (!(await GetBanData(userid))) {
				return await interaction.followUp({
					content: await r(interaction, "mod:not_banned"),
					ephemeral: true
				})
			}

			const stupidFuckingButton = new ButtonBuilder()
				.setLabel(await r(interaction, "generic:confirm_unban_button"))
				.setCustomId(`112-confirm-unban-${userid}`)
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(
				stupidFuckingButton
			);

			const ru = await GetUserDetails(parseInt(userid));

			return await interaction.followUp({
				content: await r(interaction, "generic:prompt_unban_confirm", { user: `[${ru.displayName}](https://fxroblox.com/users/${userid})` }),
				components: [row as any],
				ephemeral: true,
			});
		}
	}
}
