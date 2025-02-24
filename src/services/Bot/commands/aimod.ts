import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { generateBanReason } from "../../GenAI/gen";
import { BanUser } from "../../Database/helpers/RobloxBan";
import { GetUserIdFromName, GetUserDetails } from "../../../lib/roblox";

class SlashCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "AI Moderation Tools",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "generate_ban_reason",
					chatInputRun: "chatInputGenerateBanReason",
				},
				{
					name: "ban_user",
					chatInputRun: "chatInputBanUser",
				},
			],
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
						.setDescription("Generates a ban reason for a user using AI")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription("The Roblox username to generate a ban reason for")
								.setRequired(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("ban_user")
						.setDescription("Bans a user from 112 using AI-generated ban reason")
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
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		await interaction.deferReply({ ephemeral: false });

		const username = interaction.options.getString("username", true);
		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: `Failed to resolve username: ${username}`,
				ephemeral: true,
			});
		}

		const userDetails = await GetUserDetails(userId);
		const banReason = await generateBanReason(userId.toString());


		return interaction.followUp({
			content: `I've deemed [${userDetails.displayName}](https://fxroblox.com/users/${userId})'s ban to be **${banReason.justified ? 'justified' : 'unjust'}**.\n**Reason:** \`\`\`${banReason.ban_reason}\`\`\`\nHere's my reasoning behind it: \`\`\`${banReason.comment}\`\`\``,
			ephemeral: false,
		});
	}

	public async chatInputBanUser(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		await interaction.deferReply({ ephemeral: false });

		const username = interaction.options.getString("username", true);
		const userId = await GetUserIdFromName(username);
		if (!userId) {
			return interaction.followUp({
				content: `Failed to resolve username: ${username}`,
				ephemeral: true,
			});
		}

		const banReason = await generateBanReason(userId.toString());

		const userDetails = await GetUserDetails(userId);

		try {
			await BanUser({
				UserID: userId.toString(),
				ModeratorId: interaction.user.id,
				ModeratorName: interaction.user.displayName,
				BannedFrom: "All", // DEPRECATED
				BannedUntil: "-1", // Banned forever
				Reason: banReason.ban_reason,
				hackBan: false,
				noFederate: true
			});
			return interaction.followUp({
				content: `Successfully banned [${userDetails.displayName}](https://fxroblox.com/users/${userId}) with reason:\n\`\`\`${banReason.ban_reason}\`\`\``,
				ephemeral: false,
			});
		} catch (error) {
			return interaction.followUp({
				content: `Failed to ban user: ${error}`,
				ephemeral: true,
			});
		}
	}
}

export default SlashCommand;
