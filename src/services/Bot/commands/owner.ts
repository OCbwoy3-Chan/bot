import { Command, PreconditionEntryResolvable } from '@sapphire/framework';
import { BanUser, GetBanData, SetPermissionLevel } from '../../Database/db';
import { Subcommand } from '@sapphire/plugin-subcommands';


class SlashCommand extends Subcommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Commands to manage global bans.',
			preconditions: <unknown>["OwnerOnly"] as PreconditionEntryResolvable[],
			subcommands: [
				{
				  name: 'rank',
				  chatInputRun: 'chatInputRank'
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
						.setName('rank')
						.setDescription('Rank a user')
						.addUserOption((option) => option.setName('user').setDescription('User to rank').setRequired(true))
						.addNumberOption((option) => option.setName('role_id').setDescription('Target Role ID').setRequired(true).setAutocomplete(true),
					)
				)
				// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputRank(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.options.get('user')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };
		// if (!interaction.options.get('role_id')?.value) { await interaction.reply({ content: ":skull:", ephemeral: true }); return; };

		const user = interaction.options.get('user')?.value as number;
		const roleid = interaction.options.get('role_id')?.value as number;

		SetPermissionLevel(user.toString(),roleid)

		return interaction.reply({ content: `> Sucessfully ranked <@${user}> to ${roleid}`, ephemeral: true });
	}

}

export default SlashCommand
