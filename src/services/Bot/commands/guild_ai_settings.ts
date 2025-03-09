import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType
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
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { r } from "112-l10n";

class GuildSettingsCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "guild-ai",
			description: "Guild AI Settings",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "reset",
					chatInputRun: "chatInputClearGuild",
				},
				{
					name: "set",
					chatInputRun: "chatInputSetGuildPrompt",
				},
				{
					name: "get",
					chatInputRun: "chatInputGetGuildPrompt",
				},
				{
					name: "reset_channel",
					chatInputRun: "chatInputClearChannel",
				},
				{
					name: "set_channel",
					chatInputRun: "chatInputSetChannelPrompt",
				},
				{
					name: "get_channel",
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
						.setName("reset")
						.setDescription("Resets the guild's AI prompt")
				)
				.addSubcommand((builder) =>
					builder
						.setName("set")
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
						.setName("get")
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
						.setName("set_channel")
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
						.setName("get_channel")
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
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true,
			});
		}

		const prompt = await GetGuildPrompt(interaction.guildId!);

		return await interaction.reply({
			content: prompt ? await r(interaction, "ai:current_prompt_server", { prompt }) : await r(interaction, "ai:no_prompt_set"),
			ephemeral: true,
		});
	}

	public async chatInputClearChannel(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		await ClearChannelPrompt(channelId.id);

		try { chatManager.clearChat(channelId.id); } catch { };

		return await interaction.reply({
			content: await r(interaction, "generic:done"),
			ephemeral: true,
		});
	}

	public async chatInputSetChannelPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		const prompt = interaction.options.getString("prompt", true);
		await SetChannelPrompt(channelId.id, prompt);

		try { chatManager.clearChat(channelId.id); } catch { };

		return await interaction.reply({
			content: await r(interaction, "generic:done"),
			ephemeral: true,
		});
	}

	public async chatInputGetChannelPrompt(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true,
			});
		}

		const channelId = interaction.options.getChannel("channel", true);
		const prompt = await GetChannelPrompt(channelId.id);

		return await interaction.reply({
			content: prompt ? await r(interaction, "ai:current_prompt_channel", { prompt }) : await r(interaction, "ai:no_prompt_set"),
			ephemeral: true,
		});
	}
}

export default GuildSettingsCommand;
