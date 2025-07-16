import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { getCachedPromptsJ } from "../../../GenAI/prompt/GeneratePrompt";

export class AutocompleteHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete
		});
	}

	public override async run(
		interaction: AutocompleteInteraction,
		result: InteractionHandler.ParseResult<this>
	) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// if (interaction.commandId !== '1000802763292020737') return this.none();

		const focusedOption = interaction.options.getFocused(true);

		switch (focusedOption.name) {
			case "prompt": {
				const isOwner =
					interaction.user.id === "486147449703104523" ? true : false;
				const sr: [string, string][] = [];
				getCachedPromptsJ()
					.filter((a) => (isOwner ? true : !a.hidden))
					.forEach((v) => {
						if (
							`${v.name}\0${v.filename}\0${v.description}`
								.toUpperCase()
								.trim()
								.includes(
									focusedOption.value.toUpperCase().trim()
								)
						) {
							sr.push([
								isOwner
									? `${v.name_aichooser || v.name} (${v.filename})`
									: v.name,
								v.filename
							]);
						}
					});

				sr.splice(20, 420); // 20 maximum enforced by discord

				const srm = sr.map((match) => ({
					name: match[0],
					value: match[1]
				}));
				return this.some(srm);
			}
			default:
				return this.none();
		}
	}
}
