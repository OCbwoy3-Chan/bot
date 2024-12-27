import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import {
	type StringSelectMenuInteraction,
	type ButtonInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { IsWhitelisted, UnbanUser } from "../../Database/db";
import { GetUserDetails } from "../../../lib/roblox";
import { general } from "../../../locale/commands";

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
			const ru = await GetUserDetails(parseInt(userid));

			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: general.errors.missingPermission("WHITELIST"),
					ephemeral: true,
				});
			}

			try {
				await UnbanUser(userid);
			} catch (e_) {
				return await interaction.reply({
					content: `> ${e_}`,
					ephemeral: true,
				});
			}

			return await interaction.reply({
				content: `> [${ru.displayName}](https://fxroblox.com/users/${userid}) has been unbanned.`,
				ephemeral: false,
			});
		}

		if (interaction.customId.startsWith("112-unban-")) {
			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: general.errors.missingPermission("WHITELIST"),
					ephemeral: true,
				});
			}

			const userid = interaction.customId.replace("112-unban-", "");

			const stupidFuckingButton = new ButtonBuilder()
				.setLabel("CONFIRM UNBAM")
				.setCustomId(`112-confirm-unban-${userid}`)
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(
				stupidFuckingButton
			);

			const ru = await GetUserDetails(parseInt(userid));

			return await interaction.reply({
				content: `> Are you sure you want to unban [${ru.displayName}](https://fxroblox.com/users/${userid})?`,
				components: [row as any],
				ephemeral: true,
			});
		}
	}
}
