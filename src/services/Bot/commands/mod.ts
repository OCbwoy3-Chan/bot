import { Command } from '@sapphire/framework';
import { banningCommands, infoCommand } from '../../../locale/commands';
import { BanUser, GetBanData } from '../../Database/db';
import { AllBanReasons } from '../../../lib/AllBanReasons';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { GetUserDetails, GetUserIdFromName } from '../../../lib/roblox';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

class SlashCommand extends Subcommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Commands to manage global bans.',
			subcommands: [
				{
				  name: 'lookup',
				  chatInputRun: 'chatInputLookup'
				},
				{
				  name: 'ban',
				  chatInputRun: 'chatInputBan'
				},
				{
				  name: 'quickban',
				  chatInputRun: 'chatInputQuickBan'
				}
			  ]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) =>
					command
						.setName('lookup')
						.setDescription('Look up an user')
						.addStringOption((option) => option.setName('user').setDescription('Username to lookup').setRequired(true)
					)
				)
				.addSubcommand((command) =>
					command
						.setName('ban')
						.setDescription('Ban a user')
						.addStringOption((option) => option.setName('user').setDescription('The person to ban').setRequired(true))
						.addStringOption((option) => option.setName('reason').setDescription('The reason for the ban').setRequired(true))
						.addStringOption((option) => option.setName('duration').setDescription('The duration for the ban').setRequired(false))
						.addStringOption((option) => option.setName('scope').setDescription('The scope for the ban').setRequired(false),
					)
				)
				.addSubcommand((command) =>
					command
						.setName('quickban')
						.setDescription('Quickly ban a user')
						.addStringOption((option) => option.setName('user').setDescription('The person to ban').setRequired(true))
						.addStringOption((option) => option.setName('preset_reason').setDescription('The preset reason for the ban').setRequired(true).setAutocomplete(true),
					)
				)
				// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputLookup(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.options.get('user')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const userid = await GetUserIdFromName(interaction.options.get('user')?.value as string);
		if (!userid) { await interaction.reply({ content: `> ${banningCommands.errors.usernameResolveFail()}`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(userid);

		// BanUser({
		// 	UserID: "1083030325",
		// 	ModeratorId: "486147449703104523",
		// 	ModeratorName: "OCbwoy3",
		// 	BannedFrom: "All",
		// 	BannedUntil: "-1",
		// 	Reason: AllBanReasons.EUROPEAN_UNION_DSA,
		// 	Nature: "EUROPEAN_UNION_DSA"
		// })

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel('ocbwoy3.dev/lookup')
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder()
			.addComponents(stupidFuckingButton);

		if (await GetBanData(userid.toString())) {
			const stupidFuckingButton2 = new ButtonBuilder()
				.setLabel('Unban')
				.setCustomId(`112-unban-${userid.toString()}`)
				.setStyle(ButtonStyle.Danger);
			row.addComponents(stupidFuckingButton2);
		}




		const wtf = await banningCommands.success.lookupResultMessage(ud,userid);
		return interaction.reply({ content: wtf, components: [<unknown>row as any] });
	}
}

export default SlashCommand
