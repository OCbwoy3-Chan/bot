import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";
import { general } from "../../../../locale/commands";
import { prisma } from "../../../Database/db";
import { AllModels, areGenAIFeaturesEnabled } from "../../../GenAI/gemini";
import { resetOCbwoy3ChansAPIKey } from "services/Server/router/chat";
import { captureSentryException } from "@112/SentryUtil";
import { fetchT } from "@sapphire/plugin-i18next";
import { generateDependencyReport } from "@discordjs/voice";
import { AddChannelAIWhitelist, RemoveChannelAIWhitelist } from "@db/helpers/AIWhitelist";

class SlashCommand extends Subcommand {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Commands to manage 112.",
			preconditions: (<unknown>[
				"OwnerOnly"
			]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "listwl",
					chatInputRun: "chatInputListWhitelist"
				},
				{
					name: "listwl_ai",
					chatInputRun: "chatInputListAIWhitelist"
				},
				{
					name: "set_model",
					chatInputRun: "chatInputSelectModel"
				},
				{
					name: "kill",
					chatInputRun: "chatInputKill"
				},
				{
					name: "apikey",
					chatInputRun: "chatInputApiKey"
				},
				{
					name: "reset_ai",
					chatInputRun: "chatInputKillAI"
				},
				{
					name: "sentry_error",
					chatInputRun: "chatInputSentryError"
				},
				{
					name: "debug",
					chatInputRun: "chatInputDebug"
				},
				{
					name: "s_wl",
					chatInputRun: "chatInputSetChannelWhitelist"
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
					.addSubcommand((command) =>
						command
							.setName("listwl")
							.setDescription("Lists the current whitelist")
					)
					.addSubcommand((command) =>
						command
							.setName("listwl_ai")
							.setDescription("Lists the current genai whitelist")
					)
					.addSubcommand((command) =>
						command
							.setName("kill")
							.setDescription("Kills the current process")
					)
					.addSubcommand((command) =>
						command
							.setName("apikey")
							.setDescription(
								"Generates a single-use API Key for OCbwoy3-Chan AI"
							)
					)
					.addSubcommand((command) =>
						command
							.setName("reset_ai")
							.setDescription(
								"Resets AI preferences of ALL channels/guilds"
							)
					)
					.addSubcommand((command) =>
						command
							.setName("set_model")
							.setDescription("Sets OCbwoy3-Chan's AI Model")
					)
					.addSubcommand((command) =>
						command
							.setName("sentry_error")
							.setDescription(
								"Triggers a command error and reports it to Sentry (if DSN is specified)"
							)
					)
					.addSubcommand((command) =>
						command
							.setName("debug")
							.setDescription("Debugs the bot")
							.addStringOption((a) =>
								a
									.setName("what")
									.setRequired(true)
									.setDescription("What to debug")
									.addChoices([
										{
											name: "@discordjs/voice",
											value: "discordjs_voice"
										}
									])
							)
					)
					.addSubcommand((command) =>
						command
							.setName("s_wl")
							.setDescription("Sets the channel whitelist state")
							.addStringOption((a) =>
								a
									.setName("action")
									.setRequired(true)
									.setDescription("What to do")
									.addChoices([
										{
											name: "add",
											value: "add"
										},
										{
											name: "remove",
											value: "remove"
										}
									])
							)
					)
			// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputListWhitelist(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist.findMany();

		return interaction.reply({
			content: `> **${wl.length} users whitelisted**${wl.map(
				(a) => `\n> <@${a.id}>`
			)}`,
			ephemeral: true
		});
	}

	public async chatInputListAIWhitelist(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist_OCbwoy3ChanAI.findMany();

		return interaction.reply({
			content: `> **${wl.length} users genai whitelisted**${wl.map(
				(a) => `\n> <@${a.id}>`
			)}`,
			ephemeral: true
		});
	}

	public async chatInputApiKey(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist_OCbwoy3ChanAI.findMany();

		return interaction.reply({
			content: `\`\`\`${resetOCbwoy3ChansAPIKey()}\`\`\``,
			ephemeral: true
		});
	}

	public async chatInputSelectModel(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId("ocbwoy3chanai_select_model")
			.setPlaceholder("Make a selection!")
			.addOptions(
				Object.entries(AllModels).map((a) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(a[0])
						.setDescription(a[1].m + " - " + a[1].t)
						.setValue(a[1].m);
				})
			);

		const row = new ActionRowBuilder().addComponents(select);

		await interaction.reply({
			content: "Choose a model!",
			components: [row as any]
		});
	}

	public async chatInputKill(
		interaction: Command.ChatInputCommandInteraction
	) {
		await interaction.reply({
			content: `> Killing Process (Will restart if using PM2/Docker)\n> PID: ${process.pid}, Parent PID: ${process.ppid}`,
			ephemeral: true
		});
		process.kill(process.pid, "SIGTERM");
		// love this, absolutely amazing
	}

	public async chatInputKillAI(
		interaction: Command.ChatInputCommandInteraction
	) {
		await interaction.reply({
			content: `> Wiping ALL AI preferences from every guild and channel.`,
			ephemeral: true
		});
		await prisma.oCbwoy3ChanAI_ChannelSettings.deleteMany({});
		await prisma.oCbwoy3ChanAI_GuildSettings.deleteMany({});
		await interaction.followUp({
			content: "> Done",
			ephemeral: true
		});
	}

	public async chatInputSentryError(
		interaction: Command.ChatInputCommandInteraction
	) {
		const tf = await fetchT(interaction);
		await interaction.reply({
			content: tf("generic:ok"),
			ephemeral: true
		});
		try {
			throw "hi sentry!";
		} catch (e) {
			captureSentryException(e);
		}
	}

	public async chatInputDebug(
		interaction: Command.ChatInputCommandInteraction
	) {
		const whatToDebug = interaction.options.getString("what",true);

		switch (whatToDebug) {
			case "discordjs_voice": {
				await interaction.reply({
					ephemeral: true,
					content: generateDependencyReport()
				})
				break;
			}
			default: {
				await interaction.reply({
					ephemeral: true,
					content: "invalid opt"
				})
				break;
			}
		}
	}

	public async chatInputSetChannelWhitelist(
		interaction: Command.ChatInputCommandInteraction
	) {
		const action = interaction.options.getString("action", true);

		try {
			if (!interaction.channel) throw "Not a channel!";
			const channel = interaction.channel!;
			if (action === "add") {
				await AddChannelAIWhitelist(channel.id);
				return interaction.reply({
					content: `Successfully whitelisted <#${channel.id}>.`,
					ephemeral: true
				});
			} else if (action === "remove") {
				await RemoveChannelAIWhitelist(channel.id);
				return interaction.reply({
					content: `Successfully unwhitelisted <#${channel.id}>.`,
					ephemeral: true
				});
			} else {
				return interaction.reply({
					content: "error.",
					ephemeral: true
				});
			}
		} catch (error) {
			return interaction.reply({
				content: `Error: ${error}`,
				ephemeral: true
			});
		}
	}

}

export default SlashCommand;
