import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { AllBanReasons } from '../../../lib/AllBanReasons';
import { AllBanlandScopes, AllRoles } from '../../../lib/Constants';

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
		case 'scope': {
			const searchResult = AllBanlandScopes

			let sr: string[] = []
			searchResult.forEach(element => {
				if (element.toUpperCase().trim().replace("_"," ").includes(focusedOption.value.toUpperCase().trim().replace("_"," "))) {
					sr.push(element);
				}
			});

			sr.splice(20,420); // 20 maximum enforced by discord

			const srm = sr.map((match) => ({ name: match, value: match }));
			return this.some(srm);
		}
		case 'role_id': {
			const searchResult = AllRoles

			let sr: {name: string, value: number}[] = []
			Object.entries(AllRoles).forEach(element => {
				if (element[1].name.toUpperCase().trim().replace("_"," ").includes(focusedOption.value.toUpperCase().trim().replace("_"," "))) {
					sr.push({ name: element[1].name, value: parseInt(element[0]) });
				}
			});

			sr.splice(20,420); // 20 maximum enforced by discord
			return this.some(sr);
		}
		default: {
			return this.none();
		}
		}
	}
}
