import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { AllBanReasons } from '../../../lib/AllBanReasons';
import { AllBanDurations } from '../../../lib/Constants';

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
    // if (interaction.commandId !== '1000802763292020737') return this.none();

    const focusedOption = interaction.options.getFocused(true);

    switch (focusedOption.name) {
      case 'preset_reason': {
        const searchResult = Object.keys(AllBanReasons).map(a=>a.toUpperCase())

		let sr: string[] = []
		searchResult.forEach(element => {
			if (element.toUpperCase().trim().replace("_"," ").includes(focusedOption.value.toUpperCase().trim().replace("_"," "))) {
				sr.push(element);
			}
		});

		sr.splice(20,9999); // 20 maximum enforced by discord

		const srm = sr.map((match) => ({ name: match , value: match }));
        return this.some(srm);
      }
	  case 'duration': {
		let sr: [string,number][] = []
		AllBanDurations.forEach((v:[string,number])=>{
			if (v[0].toUpperCase().trim().includes(focusedOption.value.toUpperCase().trim())) {
				sr.push(v);
			}
		})

		sr.splice(20,420); // 20 maximum enforced by discord

		const srm = sr.map((match) => ({ name: match[0], value: match[1] }));
        return this.some(srm);
      }
      default:
        return this.none();
    }
  }
}
