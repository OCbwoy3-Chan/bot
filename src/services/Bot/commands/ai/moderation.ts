import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../../GenAI/gemini";
import { generateBanReason } from "../../../GenAI/gen";
import { BanUser, UpdateUserBan } from "../../../Database/helpers/RobloxBan";
import { GetUserIdFromName, GetUserDetails } from "../../../../lib/roblox";
import { isEuropean } from "@112/Utility";
import { r } from "112-l10n";
import { IsWhitelisted } from "@db/helpers/DiscordWhitelist";
import { prisma } from "@db/db";

class SlashCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "aimod",
			description: "AI Moderation Tools",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "generate_ban_reason",
					chatInputRun: "chatInputGenerateBanReason"
				},
				{
					name: "ban_user",
					chatInputRun: "chatInputBanUser"
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
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
				.addSubcommand((builder) =>
					builder
						.setName("generate_ban_reason")
						.setDescription(
							"Generates a ban reason for a user using AI"
						)
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The Roblox username to generate a ban reason for"
								)
								.setRequired(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("ban_user")
						.setDescription(
							"Bans a user from 112 using AI-generated ban reason"
						)
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription("The Roblox username to ban")
								.setRequired(true)
						)
				)
		);
	}

	public async chatInputGenerateBanReason(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}
		if (!(await IsWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "errors:missing_wl"),
				ephemeral: true
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(
				await r(interaction, "ai:not_enabled")
			);
		}
		if (isEuropean()) {
			return await interaction.reply(
				await r(interaction, "ai:eu_compliance")
			);
		}

		await interaction.deferReply({ ephemeral: false });

		const username = interaction.options.getString("username", true);
		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: await r(interaction, "errors:username_resolve", {
					user: username
				}),
				ephemeral: true
			});
		}

		let lang = "en-US";

		if (interaction.guild) {
			const guildSettings = await prisma.guildSetting.findFirst({
				where: {
					id: interaction.guild?.id
				}
			});
			lang = guildSettings?.language || "en-US";
		}

		const userDetails = await GetUserDetails(userId);
		const banReason = await generateBanReason(userId.toString(), lang);

		const vibe_check = await r(
			interaction,
			`ai:ban_justification.${banReason.justified ? "fair" : "unfair"}`,
			{
				user: `[${userDetails.displayName}](https://fxroblox.com/users/${userId})`
			}
		);

		return interaction.followUp({
			content: `${vibe_check}
\`\`\`${banReason.ban_reason}\`\`\`\n
${banReason.explanation}
-# ${banReason.comment}`,
			ephemeral: false
		});
	}

	public async chatInputBanUser(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}
		if (!(await IsWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "errors:missing_wl"),
				ephemeral: true
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(
				await r(interaction, "ai:not_enabled")
			);
		}
		if (isEuropean()) {
			return await interaction.reply(
				await r(interaction, "ai:eu_compliance")
			);
		}

		await interaction.deferReply({ ephemeral: false });

		const username = interaction.options.getString("username", true);
		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: await r(interaction, "errors:username_resolve", {
					user: username
				}),
				ephemeral: true
			});
		}

		let lang = "en-US";

		if (interaction.guild) {
			const guildSettings = await prisma.guildSetting.findFirst({
				where: {
					id: interaction.guild?.id
				}
			});
			lang = guildSettings?.language || "en-US";
		}

		const banReason = await generateBanReason(userId.toString(), lang);

		const userDetails = await GetUserDetails(userId);

		try {
			try {
				await BanUser({
					UserID: userId.toString(),
					ModeratorId: interaction.user.id,
					ModeratorName: interaction.user.displayName,
					BannedFrom: "All", // DEPRECATED
					BannedUntil: "-1", // Banned forever
					Reason: banReason.ban_reason,
					PrivateReason: `AI Generated Ban - Justified: ${banReason.justified} | ${banReason.comment} | ${banReason.explanation}`,
					hackBan: false,
					noFederate: true
				});
			} catch (e_) {
				if (`${e_}`.includes("User is already banned")) {
					await UpdateUserBan({
						UserID: userId.toString(),
						ModeratorId: interaction.user.id,
						ModeratorName: interaction.user.displayName,
						BannedFrom: "All", // DEPRECATED
						BannedUntil: "-1", // Banned forever
						Reason: banReason.ban_reason,
						PrivateReason: `AI Generated Ban - Justified: ${banReason.justified} | ${banReason.comment} | ${banReason.explanation}`,
						hackBan: false,
						noFederate: true
					});
				}
			}
			return interaction.followUp({
				content: await r(interaction, "ai:ban_acted", {
					user: `[${userDetails.displayName}](https://fxroblox.com/users/${userId})`,
					reason: `\`\`\`${banReason.ban_reason}\`\`\``
				}),
				ephemeral: false
			});
		} catch (error) {
			return interaction.followUp({
				content: `Failed to ban user: ${error}`,
				ephemeral: true
			});
		}
	}
}

export default SlashCommand;
