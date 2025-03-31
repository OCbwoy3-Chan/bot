import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { ALL_LANGUAGES } from "112-l10n";

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
			case "language": {
				const sr: [string, string][] = [];
				ALL_LANGUAGES.forEach((v) => {
					if (
						`${v.name}\0${v.id}`
							.toUpperCase()
							.trim()
							.includes(focusedOption.value.toUpperCase().trim())
					) {
						sr.push([v.name, v.id]);
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
