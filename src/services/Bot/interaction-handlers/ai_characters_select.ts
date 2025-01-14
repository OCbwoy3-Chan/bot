import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import type { StringSelectMenuInteraction } from "discord.js";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/db";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import {
	CharacterInfo,
	getCachedPromptsJ,
} from "../../GenAI/prompt/GeneratePrompt";
import { SetChatPrompt } from "../listeners/OCbwoy3ChanAI";

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
		if (interaction.customId !== "ocbwoy3chanai_select_char")
			return this.none();

		return this.some();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		const prompt = getCachedPromptsJ().filter((a) => {
			return a.filename === interaction.values[0];
		}) as [CharacterInfo];

		if (!prompt[0]) {
			return await interaction.reply({
				content: "Character not found",
				ephemeral: true,
			});
		}

		SetChatPrompt(interaction.values[0]);
		await interaction.reply(
			`<@${interaction.user.id}> set character to **${prompt[0].name}**`
		);
	}
}
