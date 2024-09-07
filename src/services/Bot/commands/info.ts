import { Command } from '@sapphire/framework';
import { infoCommand } from '../../../locale/commands';

class SlashCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Send a Slash Command.'
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const msg = await interaction.reply({
			content: "> Ping..."
		})
		const diff = msg.createdTimestamp - interaction.createdTimestamp;
		const ping = Math.round(this.container.client.ws.ping);
		const mo = await infoCommand.genContent(diff.toString(),ping.toString())
		return interaction.editReply(mo);
	}
}

export default SlashCommand