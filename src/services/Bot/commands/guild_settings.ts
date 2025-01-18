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
import {
	SetGuildPrompt,
	ClearGuildPrompt,
	GetGuildPrompt,
	SetChannelPrompt,
	ClearChannelPrompt,
	GetChannelPrompt,
} from "../../Database/helpers/AISettings";

class GuildSettingsCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "guild-setting",
			description: "Guild AI Settings",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "reset_guild",
					chatInputRun: "chatInputClearGuild",
				},
				{
					name: "set_guild_prompt",
					chatInputRun: "chatInputSetGuildPrompt",
				},
				{
					name: "get_guild_prompt",
					chatInputRun: "chatInputGetGuildPrompt",
				},
				{
					name: "reset_channel",
					chatInputRun: "chatInputClearChannel",
				},
				{
					name: "set_channel_prompt",
					chatInputRun: "chatInputSetChannelPrompt",
				},
				{
					name: "get_channel_prompt",
					chatInputRun: "chatInputGetChannelPrompt",
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
						.setName("reset_guild")
						.setDescription("Resets the guild's AI prompt")
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_guild_prompt")
						.setDescription("Sets the guild's AI prompt")
						.addStringOption((option) =>
							option
								.setName("prompt")
								.setDescription("The prompt")
								.setRequired(true)
								.setAutocomplete(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("get_guild_prompt")
						.setDescription("Gets the guild's AI prompt")
				)
				.addSubcommand((builder) =>
					builder
						.setName("reset_channel")
						.setDescription("Resets the channel's AI prompt")
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription("The channel")
								.setRequired(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_channel_prompt")
						.setDescription("Sets the channel's AI prompt")
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription("The channel")
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("prompt")
								.setDescription("The prompt")
								.setRequired(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("get_channel_prompt")
						.setDescription("Gets the channel's AI prompt")
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription("The channel")
								.setRequired(true)
						)
				)
		);
	}

	public async chatInputClearGuild(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		await ClearGuildPrompt(interaction.guildId!);

		return await interaction.reply({
			content: "Guild AI prompt cleared",
			ephemeral: true,
		});
	}

	public async chatInputSetGuildPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		const prompt = interaction.options.getString("prompt", true);
		await SetGuildPrompt(interaction.guildId!, prompt);

		return await interaction.reply({
			content: "Guild AI prompt set",
			ephemeral: true,
		});
	}

	public async chatInputGetGuildPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		const prompt = await GetGuildPrompt(interaction.guildId!);

		return await interaction.reply({
			content: prompt ? `Current guild AI prompt: ${prompt}` : "No prompt set",
			ephemeral: true,
		});
	}

	public async chatInputClearChannel(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		await ClearChannelPrompt(channelId.id);

		return await interaction.reply({
			content: "Channel AI prompt cleared",
			ephemeral: true,
		});
	}

	public async chatInputSetChannelPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		const prompt = interaction.options.getString("prompt", true);
		await SetChannelPrompt(channelId.id, prompt);

		return await interaction.reply({
			content: "Channel AI prompt set",
			ephemeral: true,
		});
	}

	public async chatInputGetChannelPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		const prompt = await GetChannelPrompt(channelId.id);

		return await interaction.reply({
			content: prompt ? `Current channel AI prompt: ${prompt}` : "No prompt set",
			ephemeral: true,
		});
	}
}

export default GuildSettingsCommand;
