import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
} from "discord.js";
import { BanlandScope } from "../../../lib/Constants";
import { GetUserDetails, GetUserIdFromName } from "../../../lib/roblox";
import { banningCommands } from "../../../locale/commands";
import { BanUser, GetBanData, UpdateUserBan } from "../../Database/helpers/RobloxBan";
import { r } from "112-l10n";
import { IsWhitelisted } from "@db/helpers/DiscordWhitelist";

class SlashCommand extends Subcommand {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Commands to manage global bans.",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "lookup",
					chatInputRun: "chatInputLookup",
				},
				{
					name: "ban",
					chatInputRun: "chatInputBan",
				},
				{
					name: "change",
					chatInputRun: "chatInputUpdate",
				},
			],
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
					.addSubcommand((command) =>
						command
							.setName("lookup")
							.setDescription("Look up an user")
							.addStringOption((option) =>
								option
									.setName("user")
									.setDescription("Username to lookup")
									.setRequired(true)
							)
					)
					.addSubcommand((command) =>
						command
							.setName("ban")
							.setDescription("Ban a user")
							.addStringOption((option) =>
								option
									.setName("user")
									.setDescription("The person to ban")
									.setRequired(true)
							)
							.addStringOption((option) =>
								option
									.setName("reason")
									.setDescription("The reason for the ban")
									.setRequired(true)
							)
							.addNumberOption((option) =>
								option
									.setName("duration")
									.setDescription("The duration for the ban")
									.setRequired(false)
									.setAutocomplete(true)
							)
							.addBooleanOption((option) =>
								option
									.setName("local")
									.setDescription("If the ban is not propogated to other services")
									.setRequired(false)
							)
					)
					.addSubcommand((command) =>
						command
							.setName("change")
							.setDescription("Update a user's ban")
							.addStringOption((option) =>
								option
									.setName("user")
									.setDescription(
										"The person whose ban to update"
									)
									.setRequired(true)
							)
							.addStringOption((option) =>
								option
									.setName("reason")
									.setDescription(
										"The new reason for the ban"
									)
									.setRequired(false)
							)
							.addNumberOption((option) =>
								option
									.setName("duration")
									.setDescription(
										"The new duration for the ban"
									)
									.setRequired(false)
									.setAutocomplete(true)
							)
							.addBooleanOption((option) =>
								option
									.setName("local")
									.setDescription("If the ban is not propogated to other services")
									.setRequired(false)
							)
					)
			// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputLookup(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!interaction.options.get("user")?.value) {
			return await interaction.reply({
				content: ":skull:",
				ephemeral: true,
			});
		}

		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});

		const userid = await GetUserIdFromName(
			(interaction.options.get("user")?.value as string).trim()
		);
		if (!userid) {
			return await interaction.followUp({
				content: await r(interaction, "errors:username_resolve_no_arg"),
				ephemeral: true,
			});
		}
		const ud = await GetUserDetails(userid);

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel("ocbwoy3.dev/lookup")
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder().addComponents(stupidFuckingButton);

		if (await GetBanData(userid.toString())) {
			const stupidFuckingButton2 = new ButtonBuilder()
				.setLabel(await r(interaction, "generic:button_unban"))
				.setCustomId(`112-unban-${userid.toString()}`)
				.setStyle(ButtonStyle.Danger);
			row.addComponents(stupidFuckingButton2);
		}

		const wtf = await banningCommands.success.lookupResultMessage(
			ud,
			userid,
			interaction
		);
		return await interaction.followUp({
			content: wtf,
			components: [(<unknown>row) as any],
		});
	}

	public async chatInputBan(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!(await IsWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "errors:missing_wl"),
				ephemeral: true,
			});
		}

		if (!interaction.options.get("user")?.value) {
			await interaction.reply({ content: ":skull:", ephemeral: true });
			return;
		}

		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});

		const reason =
			interaction.options.getString("reason") ||
			await r(interaction, "generic:ban_reason_unspecified");
		const duration =
			interaction.options.getNumber("duration") || -1;
		const nofed =
			interaction.options.getBoolean("local") || false;
		const scope = "All"; // ! DEPRECATED

		let isHackban = false;

		// console.log(Math.ceil(Date.now()/1000),duration);

		let date: number = Math.ceil(Date.now() / 1000) + Math.abs(duration);

		if (duration === -1) {
			date = -1;
		}

		const userid = await GetUserIdFromName(
			(interaction.options.get("user")?.value as string).trim()
		);
		if (!userid) {
			return await interaction.followUp({
				content: await r(interaction, "errors:username_resolve_no_arg"),
				ephemeral: true,
			});
		}
		const ud = await GetUserDetails(userid);

		try {
			await BanUser({
				UserID: userid.toString(),
				ModeratorId: interaction.user.id,
				ModeratorName: interaction.user.displayName,
				BannedFrom: scope as BanlandScope, // ! DEPRECATED
				BannedUntil: date.toString(),
				Reason: reason,
				hackBan: isHackban,
				noFederate: nofed
			});
		} catch (e_) {
			return interaction.followUp({ content: `> ${e_}`, ephemeral: true });
		}

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel("ocbwoy3.dev/lookup")
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder().addComponents(stupidFuckingButton);

		return await interaction.followUp({
			content: await r(interaction, "generic:ban_success", { user: `[${ud.displayName}](https://fxroblox.com/users/${userid})` }),
			components: [(<unknown>row) as any],
		});
	}

	public async chatInputUpdate(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!(await IsWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "errors:missing_wl"),
				ephemeral: true,
			});
		}

		if (!interaction.options.get("user")?.value) {
			await interaction.reply({ content: ":skull:", ephemeral: true });
			return;
		}

		await interaction.deferReply({
			ephemeral: false,
			fetchReply: true
		});

		const userid = await GetUserIdFromName(
			(interaction.options.get("user")?.value as string).trim()
		);

		if (!userid) {
			return await interaction.followUp({
				content: await r(interaction, "errors:username_resolve_no_arg"),
				ephemeral: true,
			});
		}

		const existingBan = await GetBanData(userid.toString());
		if (!existingBan) {
			return await interaction.followUp({
				content: await r(interaction, "errors:user_not_banned"),
				ephemeral: true,
			});
		}

		const reason =
			interaction.options.getString("reason") ||
			existingBan.reason ||
			await r(interaction, "generic:ban_reason_unspecified");
		const duration =
			interaction.options.getNumber("duration") ||
			parseInt(existingBan.bannedUntil) - Math.ceil(Date.now() / 1000) ||
			-1;
		const nofed =
			interaction.options.getBoolean("local") || existingBan.noFederate || false;
		const scope = "All"; // ! DEPRECATED

		let isHackban = existingBan.hackBan;

		let date: number = Math.ceil(Date.now() / 1000) + Math.abs(duration);

		if (duration === -1) {
			date = -1;
		}

		const ud = await GetUserDetails(userid);

		try {
			await UpdateUserBan({
				UserID: userid.toString(),
				ModeratorId: interaction.user.id,
				ModeratorName: interaction.user.displayName,
				BannedFrom: scope as BanlandScope, // ! DEPRECATED
				BannedUntil: date.toString(),
				Reason: reason,
				hackBan: isHackban,
				noFederate: nofed
			});
		} catch (e_) {
			return interaction.followUp({ content: `> ${e_}`, ephemeral: true });
		}

		const stupidFuckingButton = new ButtonBuilder()
			.setLabel("ocbwoy3.dev/lookup")
			.setURL(banningCommands.lookups.lookupWebsiteLink(ud.username))
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder().addComponents(stupidFuckingButton);

		return await interaction.followUp({
			content: await r(interaction, "generic:ban_update_success", { user: `[${ud.displayName}](https://fxroblox.com/users/${userid})` }),
			components: [(<unknown>row) as any],
		});
	}
}

export default SlashCommand;
