import { r } from "112-l10n";
import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import {
	MessageFlags,
	type ButtonInteraction,
	type StringSelectMenuInteraction
} from "discord.js";

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
		if (interaction.customId.startsWith("ocbwoy3chan_tool_noop_"))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		await interaction.reply({
			content: await r(interaction, "ai:help_msg"),
			flags: [MessageFlags.Ephemeral]
		});
	}
}
