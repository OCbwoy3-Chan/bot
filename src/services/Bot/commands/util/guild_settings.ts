import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { PermissionFlagsBits } from "discord.js";
import { prisma } from "@db/db";
import { r } from "112-l10n";
import { _clearCachedGuildLang } from "../../bot";

class SlashCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "guild-setting",
			description: "Guild Settings",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
			subcommands: [
				{
					name: "language",
					chatInputRun: "chatInputSetLocale"
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((builder) =>
					builder
						.setName("language")
						.setDescription(
							"Sets OCbwoy3-Chan's language for the current guild"
						)
						.addStringOption((option) =>
							option
								.setName("language")
								.setDescription("The language")
								.setRequired(true)
								.setAutocomplete(true)
						)
				)
		);
	}

	public async chatInputSetLocale(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!interaction.guild) return;
		await interaction.deferReply({
			withResponse: true
		});

		const lang = interaction.options.getString("language");
		if (!lang) return;
		await prisma.guildSetting.upsert({
			create: {
				id: interaction.guild!.id,
				language: lang
			},
			update: {
				language: lang
			},
			where: {
				id: interaction.guild!.id
			}
		});

		_clearCachedGuildLang(interaction.guild.id);

		return await interaction.followUp({
			content: await r(interaction, "settings:update_language_success")
		});
	}
}

export default SlashCommand;
