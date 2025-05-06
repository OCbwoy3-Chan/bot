import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import {
	MessageFlags,
	type ButtonInteraction,
	type StringSelectMenuInteraction
} from "discord.js";
import { general } from "../../../../locale/commands";
import {
	AddAIWhitelist,
	RemoveAIWhitelist
} from "../../../Database/helpers/AIWhitelist";
import { r } from "112-l10n";

export class MessageComponentHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.MessageComponent
		});
	}

	public override parse(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		// console.log("wl",(/^112\-(add|remove)\-wl\-/.test(interaction.customId)),interaction.customId)
		if (/^112\-(add|remove)\-ai\-wl\-/.test(interaction.customId))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-add-ai-wl-")) {
			if (interaction.user.id !== process.env.OWNER_ID) {
				return await interaction.reply({
					content: await r(interaction, "errors:not_bot_owner"),
					flags: [MessageFlags.Ephemeral]
				});
			}

			const userid = interaction.customId.replace("112-add-ai-wl-", "");

			try {
				await AddAIWhitelist(userid);
			} catch (e_) {
				return await interaction.reply({
					content: `> ${e_}`,
					flags: [MessageFlags.Ephemeral]
				});
			}

			await interaction.reply({
				content: await r(interaction, "etc:wl.ai_a", {
					user: `<@${userid}>`
				}),
				flags: [MessageFlags.Ephemeral]
			});
			return;
		}

		if (interaction.customId.startsWith("112-remove-ai-wl-")) {
			if (interaction.user.id !== process.env.OWNER_ID) {
				return await interaction.reply({
					content: general.errors.notOwner(),
					flags: [MessageFlags.Ephemeral]
				});
			}

			const userid = interaction.customId.replace(
				"112-remove-ai-wl-",
				""
			);

			try {
				await RemoveAIWhitelist(userid);
			} catch (e_) {
				return await interaction.reply({
					content: `> ${e_}`,
					flags: [MessageFlags.Ephemeral]
				});
			}

			await interaction.reply({
				content: await r(interaction, "etc:wl.ai_r", {
					user: `<@${userid}>`
				}),
				flags: [MessageFlags.Ephemeral]
			});

			return;
		}
	}
}
