import { Command, PreconditionEntryResolvable } from '@sapphire/framework';
import { banningCommands, infoCommand } from '../../../locale/commands';
import { BanUser, GetBanData, prisma } from '../../Database/db';
import { AllBanReasons } from '../../../lib/AllBanReasons';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { GetUserDetails, GetUserIdFromName } from '../../../lib/roblox';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BanlandScope } from '../../../lib/Constants';

class SlashCommand extends Subcommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Commands to manage infractions.',
			preconditions: <unknown>["BanAccess"] as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: 'add',
					chatInputRun: 'chatInputAdd'
				},
				{
					name: 'details',
					chatInputRun: 'chatInputDetails'
				},
				{
					name: 'remove',
					chatInputRun: 'chatInputRemove'
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
						.setName('add')
						.setDescription('Add a infraction to a user')
						.addStringOption((option) => option.setName('user').setDescription('The person to moderate').setRequired(true))
						.addStringOption((option) => option.setName('reason').setDescription('The infraction reason').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('details')
						.setDescription('See the details of an infraction')
						.addStringOption((option) => option.setName('id').setDescription('The infraction ID').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('remove')
						.setDescription('Remove a infraction from a user')
						.addStringOption((option) => option.setName('id').setDescription('The infraction ID').setRequired(true))
				)
		)
	}

	public async chatInputAdd(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.options.get('user')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const userid = await GetUserIdFromName((interaction.options.get('user')?.value as string).trim());
		if (!userid) { await interaction.reply({ content: `> ${banningCommands.errors.usernameResolveFail()}`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(userid);

		const infr = await prisma.infraction.create({
			data: {
				userId: userid.toString(),
				moderator: interaction.user.id,
				reason: interaction.options.get('reason',true)?.value as string,
				created: new Date()
			}
		})

		return interaction.reply({ content: `> Created [Infraction \`${infr.infractionId}\`](https://fxroblox.com/users/${infr.userId})
> -# **Issued:** <t:${Math.floor(infr.created.getTime()/1000)}>
> -# **Moderator:** <@${infr.moderator}>
> -# **Reason:** ${infr.reason}

\`\`\`${infr.infractionId}\`\`\`` });

	}

	public async chatInputDetails(interaction: Command.ChatInputCommandInteraction) {
		const id = interaction.options.get('id')?.value
		if (!id) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const infr = await prisma.infraction.findFirst({
			where: {
				infractionId: {equals: id as string}
			}
		});

		if (!infr) { await interaction.reply({ content: `> Infraction not found`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(infr.userId);

		// console.log(infr)

		return interaction.reply({ content: `> [Infraction \`${infr.infractionId}\`](https://fxroblox.com/users/${infr.userId})
> -# **Issued:** <t:${Math.floor(infr.created.getTime()/1000)}>
> -# **Moderator:** <@${infr.moderator}>
> -# **Reason:** ${infr.reason}

\`\`\`${infr.infractionId}\`\`\`` });
	}

	public async chatInputRemove(interaction: Command.ChatInputCommandInteraction) {
		const id = interaction.options.get('id')?.value
		if (!id) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		const infr = await prisma.infraction.delete({
			where: {
				infractionId: id as string
			}
		});

		if (!infr) { await interaction.reply({ content: `> Infraction not found`, ephemeral: true }); return;	}
		const ud = await GetUserDetails(infr.userId);

		// console.log(infr)

		return interaction.reply({ content: `> Deleted [Infraction \`${infr.infractionId}\`](https://fxroblox.com/users/${infr.userId})
> -# **Issued:** <t:${Math.floor(infr.created.getTime()/1000)}>
> -# **Moderator:** <@${infr.moderator}>
> -# **Reason:** ${infr.reason}

\`\`\`${infr.infractionId}\`\`\`` });
	}

}

export default SlashCommand
