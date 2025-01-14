import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";
import { general } from "../../../locale/commands";
import { AddWhitelist, RemoveWhitelist } from "../../Database/db";

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
		// console.log("wl",(/^112\-(add|remove)\-wl\-/.test(interaction.customId)),interaction.customId)
		if (/^112\-(add|remove)\-wl\-/.test(interaction.customId))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-add-wl-")) {
			if (interaction.user.id !== process.env.OWNER_ID) {
				return await interaction.reply({
					content: general.errors.notOwner(),
					ephemeral: true,
				});
			}

			const userid = interaction.customId.replace("112-add-wl-", "");

			try {
				await AddWhitelist(userid);
			} catch (e_) {
				return await interaction.reply({
					content: `> ${e_}`,
					ephemeral: true,
				});
			}

			await interaction.reply({
				content: `> ${userid} has been whitelisted.`,
				ephemeral: false,
			});
			return;
		}

		if (interaction.customId.startsWith("112-remove-wl-")) {
			if (interaction.user.id !== process.env.OWNER_ID) {
				return await interaction.reply({
					content: general.errors.notOwner(),
					ephemeral: true,
				});
			}

			const userid = interaction.customId.replace("112-remove-wl-", "");

			try {
				await RemoveWhitelist(userid);
			} catch (e_) {
				return await interaction.reply({
					content: `> ${e_}`,
					ephemeral: true,
				});
			}

			await interaction.reply({
				content: `> ${userid} has been unwhitelisted.`,
				ephemeral: false,
			});
			return;
		}
	}
}
