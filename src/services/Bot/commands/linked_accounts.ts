import { Command, ContextMenuCommand } from "@sapphire/framework";
import {
	APIEmbed,
	ApplicationCommandType,
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	RawFile,
	UserContextMenuCommandInteraction
} from "discord.js";
import { prisma } from "../../Database/db";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder
				.setName("Linked Accounts")
				.setType(ApplicationCommandType.User)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall
				)
		);
	}

	public override async contextMenuRun(
		interaction: UserContextMenuCommandInteraction,
		context: ContextMenuCommand.RunContext
	): Promise<any> {
		const user = interaction.targetUser;

		const linkedAccounts = await prisma.whitelist_RobloxUser.findMany({
			where: {
				discordId: {
					equals: user.id
				}
			}
		})

		const embed: APIEmbed = {
			title: `${user.displayName}`,
			fields: [
				{ name: "Linked Accounts", value: `${linkedAccounts.length === 0 ? "None" : linkedAccounts.length}`, inline: false }
			],
			thumbnail: { url: user.displayAvatarURL() },
			color: 0x00ff00,
		};

		const filesToSend: RawFile[] = [];

		if (linkedAccounts.length !== 0) {
			filesToSend.push({
				contentType: "application/json",
				name: "accounts.json",
				data: JSON.stringify({
					discord: user.id,
					roblox: linkedAccounts.map(a=>a.robloxId)
				},undefined,"\t"),
			});
		}

		await interaction.reply({
			embeds: [embed],
			ephemeral: false,
			files: filesToSend.map((a) => {
				return new AttachmentBuilder(
					Buffer.from(a.data as string),
					{
						name: a.name,
					}
				);
			}),
		});
	}
}

export default SlashCommand;
