import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";
import { GetUserDetails, GetUserIdFromName } from "../../../../lib/roblox";
import {
	addRobloxWhitelist,
	removeRobloxWhitelist
} from "../../../Database/helpers/RobloxWhitelist";
import { r } from "112-l10n";

class SlashCommand extends Subcommand {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			name: "wl",
			description: "Commands to manage 112's Roblox whitelists.",
			preconditions: (<unknown>[
				"OwnerOnly"
			]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "add",
					chatInputRun: "chatInputAdd"
				},
				{
					name: "remove",
					chatInputRun: "chatInputRemove"
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.setContexts(
						InteractionContextType.BotDM,
						InteractionContextType.Guild,
						InteractionContextType.PrivateChannel
					)
					.setIntegrationTypes(
						ApplicationIntegrationType.GuildInstall,
						ApplicationIntegrationType.UserInstall
					)
					.addSubcommand((subcommand) =>
						subcommand
							.setName("add")
							.setDescription(
								"Add a user to the Roblox whitelist"
							)
							.addStringOption((option) =>
								option
									.setName("username")
									.setDescription(
										"The Roblox username to whitelist"
									)
									.setRequired(true)
							)
							.addUserOption((option) =>
								option
									.setName("user")
									.setDescription(
										"The Discord ID to associate with the Roblox user"
									)
									.setRequired(true)
							)
					)
					.addSubcommand((subcommand) =>
						subcommand
							.setName("remove")
							.setDescription(
								"Remove a user from the Roblox whitelist"
							)
							.addStringOption((option) =>
								option
									.setName("username")
									.setDescription(
										"The Roblox username to remove from the whitelist"
									)
									.setRequired(true)
							)
					)
			// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputAdd(
		interaction: Command.ChatInputCommandInteraction
	) {
		const username = interaction.options.getString("username", true);
		const user = interaction.options.getUser("user", true);

		await interaction.deferReply({
			fetchReply: true
		});

		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: await r(interaction, "errors:username_resolve_no_arg"),
				flags: [MessageFlags.Ephemeral]
			});
		}

		const ud = await GetUserDetails(userId);

		try {
			await addRobloxWhitelist(userId.toString(), user.id);
			return interaction.followUp({
				content: await r(interaction, "generic:wl_success", {
					user: `[${ud.displayName}](https://fxroblox.com/users/${userId})`,
					discord: `<@${user.id}>`
				})
			});
		} catch (error) {
			return interaction.followUp({
				content: `${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}

	public async chatInputRemove(
		interaction: Command.ChatInputCommandInteraction
	) {
		const username = interaction.options.getString("username", true);

		await interaction.deferReply({
			fetchReply: true
		});

		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: await r(interaction, "errors:username_resolve_no_arg"),
				flags: [MessageFlags.Ephemeral]
			});
		}

		const ud = await GetUserDetails(userId);

		try {
			await removeRobloxWhitelist(userId.toString());
			return interaction.followUp({
				content: await r(interaction, "generic:unwl_success", {
					user: `[${ud.displayName}](https://fxroblox.com/users/${userId})`
				}),
				flags: [MessageFlags.Ephemeral]
			});
		} catch (error) {
			return interaction.followUp({
				content: `${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}
}

export default SlashCommand;
