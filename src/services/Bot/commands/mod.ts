import { Command, PreconditionEntryResolvable } from '@sapphire/framework';
import { banningCommands, infoCommand } from '../../../locale/commands';
import { BanUser, GetBanData } from '../../Database/db';
import { AllBanReasons } from '../../../lib/AllBanReasons';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { GetUserDetails, GetUserIdFromName } from '../../../lib/roblox';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BanlandScope } from '../../../lib/Constants';

class SlashCommand extends Subcommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Commands to manage global bans.',
			preconditions: <unknown>["BanAccess"] as PreconditionEntryResolvable[],
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
						.addNumberOption((option) => option.setName('duration').setDescription('The duration for the ban').setRequired(false).setAutocomplete(true))
						.addStringOption((option) => option.setName('scope').setDescription('The scope for the ban').setRequired(false).setAutocomplete(true),
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
		const userid = await GetUserIdFromName((interaction.options.get('user')?.value as string).trim());
		if (!userid) { await interaction.reply({ content: `> ${banningCommands.errors.usernameResolveFail()}`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(userid);

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

	public async chatInputBan(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.options.get('user')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const reason = interaction.options.get('reason')?.value as string || "Unspecified reason";
		const duration = interaction.options.get('duration')?.value as number || -1;
		const scope = interaction.options.get('scope')?.value as string || "All";

		// console.log(Math.ceil(Date.now()/1000),duration);

		let date: number = (Math.ceil(Date.now()/1000) + Math.abs(duration));

		if (duration === -1) {
			date = -1;
		}

		const userid = await GetUserIdFromName((interaction.options.get('user')?.value as string).trim());
		if (!userid) { await interaction.reply({ content: `> ${banningCommands.errors.usernameResolveFail()}`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(userid);

		try {
			await BanUser({
				UserID: userid.toString(),
				ModeratorId: interaction.user.id,
				ModeratorName: interaction.user.displayName,
				BannedFrom: scope as BanlandScope,
				BannedUntil: date.toString(),
				Reason: reason,
				Nature: "CUSTOM_REASON"
			})
		} catch (e_) {
			return interaction.reply({ content: `> ${e_}`, ephemeral: true })
		}

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel('ocbwoy3.dev/lookup')
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder()
			.addComponents(stupidFuckingButton);

		return interaction.reply({ content: `> Sucessfully banned [${ud.displayName}](https://fxroblox.com/users/${userid}) from \`${scope}\`!`, components: [<unknown>row as any] });
	}

	public async chatInputQuickBan(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.options.get('user')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const reason = interaction.options.get('preset_reason')?.value as string || "CUSTOM_REASON";
		const scope = interaction.options.get('scope')?.value as string || "All";

		let date: number = -1;
		let d = "";
		let r = "";
		Object.entries(AllBanReasons).forEach((a:[string,string])=>{
			if (a[0] === reason) {
				d = a[0];
				r = a[1];
			}
		})

		const userid = await GetUserIdFromName((interaction.options.get('user')?.value as string).trim());
		if (!userid) { await interaction.reply({ content: `> ${banningCommands.errors.usernameResolveFail()}`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(userid);

		try {
			await BanUser({
				UserID: userid.toString(),
				ModeratorId: interaction.user.id,
				ModeratorName: interaction.user.displayName,
				BannedFrom: scope as BanlandScope,
				BannedUntil: date.toString(),
				Reason: r,
				Nature: d
			})
		} catch (e_) {
			return interaction.reply({ content: `> ${e_}`, ephemeral: true })
		}

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel('ocbwoy3.dev/lookup')
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder()
			.addComponents(stupidFuckingButton);

		return interaction.reply({ content: `> Sucessfully banned [${ud.displayName}](https://fxroblox.com/users/${userid}) from \`${scope}\`!`, components: [<unknown>row as any] });
	}
}

export default SlashCommand
