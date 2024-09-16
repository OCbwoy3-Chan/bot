import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type StringSelectMenuInteraction, type ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { IsAllowed, UnbanUser } from '../../Database/db';
import { GetUserDetails } from '../../../lib/roblox';
import { general } from '../../../locale/commands';
import { AllPermissions } from '../../../lib/Constants';

export class MessageComponentHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.MessageComponent
		});
	}

	public override parse(interaction: ButtonInteraction | StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith(`112-`)) return this.none();

		return this.some();
	}

	public async run(interaction: ButtonInteraction | StringSelectMenuInteraction) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-confirm-unban-")) {

			const userid = interaction.customId.replace("112-confirm-unban-","")
			const ru = await GetUserDetails(parseInt(userid))

			try {
				await UnbanUser(userid);
			} catch(e_) {
				return interaction.reply({
					content: `> ${e_}`,
					ephemeral: true
				});
			}


			await interaction.reply({
				content: `> [${ru.displayName}](https://fxroblox.com/users/${userid}) has been unbanned.`,
				ephemeral: false
			});
			return;
		}

		if (interaction.customId.startsWith("112-unban-")) {

			if (!(await IsAllowed(interaction.user.id,AllPermissions.GBANS))) {
				return interaction.reply({
					content: general.errors.missingPermission(AllPermissions.GBANS),
					ephemeral: true
				});
			}

			const userid = interaction.customId.replace("112-unban-","")

			const stupidFuckingButton = new ButtonBuilder()
				.setLabel('CONFIRM UNBAM')
				.setCustomId(`112-confirm-unban-${userid}`)
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder()
				.addComponents(stupidFuckingButton);

			const ru = await GetUserDetails(parseInt(userid));

			await interaction.reply({
				content: `> Are you sure you want to unban [${ru.displayName}](https://fxroblox.com/users/${userid})?`,
				components: [row as any],
				ephemeral: true
			});
			return;
		}

	}
}
