import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { AllBanReasons } from '../../../lib/AllBanReasons';

export class AutocompleteHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    // Only run this interaction for the command with ID '1000802763292020737'
    // if (interaction.commandId !== '1000802763292020737') return this.none();

    // Get the focussed (current) option
    const focusedOption = interaction.options.getFocused(true);

    // Ensure that the option name is one that can be autocompleted, or return none if not.
    switch (focusedOption.name) {
      case 'preset_reason': {
        // Search your API or similar. This is example code!
        const searchResult = Object.keys(AllBanReasons).map(a=>a.toUpperCase())

		let sr: string[] = []
		searchResult.forEach(element => {
			if (element.includes(focusedOption.value.toUpperCase().trim())) {
				sr.push(element)
			}
		});

		sr.splice(20,100)

		const srm = sr.map((match) => ({ name: match, value: match }))

        // Map the search results to the structure required for Autocomplete
        return this.some(srm);
      }
      default:
        return this.none();
    }
  }
}
