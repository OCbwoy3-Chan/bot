import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} from "discord.js";
import { general } from "../../../locale/commands";
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
		if (/^112\-show\-ai\-wl\-/.test(interaction.customId))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-show-ai-wl-")) {
			if (interaction.user.id !== process.env.OWNER_ID) {
				return await interaction.reply({
					content: general.errors.notOwner(),
					ephemeral: true
				});
			}

			const userid = interaction.customId.replace("112-show-ai-wl-", "");

			const addWhitelistButton = new ButtonBuilder()
				.setLabel(await r(interaction, "generic:button_whitelist"))
				.setCustomId(`112-add-ai-wl-${userid}`)
				.setStyle(ButtonStyle.Primary);

			const removeWhitelistButton = new ButtonBuilder()
				.setLabel(await r(interaction, "generic:button_unwhitelist"))
				.setCustomId(`112-remove-ai-wl-${userid}`)
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(
				addWhitelistButton,
				removeWhitelistButton
			);

			await interaction.reply({
				// content: "Choose AI actions",
				components: [row as any],
				ephemeral: true
			});
		}
	}
}
