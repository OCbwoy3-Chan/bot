import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import type { StringSelectMenuInteraction } from "discord.js";
import { general } from "../../../locale/commands";
import { AllModels, areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { SetAIModel } from "../listeners/OCbwoy3ChanAI";

export class MenuHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		if (interaction.customId !== "ocbwoy3chanai_select_model")
			return this.none();

		return this.some();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		if (interaction.user.id !== process.env.OWNER_ID!) {
			return await interaction.reply({
				content: general.errors.missingPermission(
					"GENERATIVE_AI_MANAGE_MODEL"
				),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		const model = Object.entries(AllModels).filter(
			(a) => a[1].m === interaction.values[0]
		) as [[string, { m: string; t: string }]?];

		if (!model[0]) {
			return await interaction.reply({
				content: "model not found",
				ephemeral: true,
			});
		}

		SetAIModel(interaction.values[0]);
		await interaction.reply(
			`<@${interaction.user.id}> set model to **${model[0][0]}**`
		);
	}
}
