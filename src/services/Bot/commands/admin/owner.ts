import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags,
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
import {
	AddChannelAIWhitelist,
	RemoveChannelAIWhitelist
} from "@db/helpers/AIWhitelist";
import { getCachedPromptsJ } from "@ocbwoy3chanai/prompt/GeneratePrompt";
import { GetChannelPrompt, GetGuildPrompt } from "@db/helpers/AISettings";
import { sep } from "path";
import { randomBytes } from "crypto";

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
				},
				{
					name: "add_gban_provider",
					chatInputRun: "chatInputAddGbanProvider"
				},
				{
					name: "remove_gban_provider",
					chatInputRun: "chatInputRemoveGbanProvider"
				},
				{
					name: "reset_gban_key",
					chatInputRun: "chatInputResetGbanKey"
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
											name: "Discord.js Voice Dependencies",
											value: "discordjs_voice"
										},
										{
											name: "AI Characters",
											value: "ai_characters"
										},
										{
											name: "AI Character Selecetion",
											value: "ai_selection"
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
					.addSubcommand((command) =>
						command
							.setName("add_gban_provider")
							.setDescription("Adds a new GBan provider")
							.addStringOption((option) =>
								option
									.setName("handler_id")
									.setDescription("The unique handler ID for the provider")
									.setRequired(true)
							)
					)
					.addSubcommand((command) =>
						command
							.setName("remove_gban_provider")
							.setDescription("Removes an existing GBan provider")
							.addStringOption((option) =>
								option
									.setName("handler_id")
									.setDescription("The unique handler ID for the provider")
									.setRequired(true)
							)
							.addBooleanOption((option) =>
								option
									.setName("delete_bans")
									.setDescription("Deletes the provider's bans if true")
									.setRequired(true)
							)
					)
					.addSubcommand((command) =>
						command
							.setName("reset_gban_key")
							.setDescription("Resets the API key for a GBan provider")
							.addStringOption((option) =>
								option
									.setName("handler_id")
									.setDescription("The unique handler ID for the provider")
									.setRequired(true)
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
			flags: [MessageFlags.Ephemeral]
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
			flags: [MessageFlags.Ephemeral]
		});
	}

	public async chatInputApiKey(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist_OCbwoy3ChanAI.findMany();

		return interaction.reply({
			content: `\`\`\`${resetOCbwoy3ChansAPIKey()}\`\`\``,
			flags: [MessageFlags.Ephemeral]
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
			flags: [MessageFlags.Ephemeral]
		});
		process.kill(process.pid, "SIGTERM");
		// love this, absolutely amazing
	}

	public async chatInputKillAI(
		interaction: Command.ChatInputCommandInteraction
	) {
		await interaction.reply({
			content: `> Wiping ALL AI preferences from every guild and channel.`,
			flags: [MessageFlags.Ephemeral]
		});
		await prisma.oCbwoy3ChanAI_ChannelSettings.deleteMany({});
		await prisma.oCbwoy3ChanAI_GuildSettings.deleteMany({});
		await interaction.followUp({
			content: "> Done",
			flags: [MessageFlags.Ephemeral]
		});
	}

	public async chatInputSentryError(
		interaction: Command.ChatInputCommandInteraction
	) {
		const tf = await fetchT(interaction);
		await interaction.reply({
			content: tf("generic:ok"),
			flags: [MessageFlags.Ephemeral]
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
		const whatToDebug = interaction.options.getString("what", true);

		switch (whatToDebug) {
			case "discordjs_voice": {
				await interaction.reply({
					flags: [MessageFlags.Ephemeral],
					content: generateDependencyReport()
				});
				break;
			}
			case "ai_characters": {
				await interaction.reply({
					flags: [MessageFlags.Ephemeral],
					files: [
						new AttachmentBuilder(
							Buffer.from(JSON.stringify(getCachedPromptsJ())),
							{
								name: "char.json"
							}
						)
					]
				});
				break;
			}
			case "ai_selection": {
				let x = [`S Default ChatPrompt -> ocbwoy3_chan${sep}default`];
				const channelPrompt = await GetChannelPrompt(
					interaction.channel!.id
				);
				if (channelPrompt) {
					x.push(`S Channel -> ${channelPrompt}`);
				} else if (interaction!.guild) {
					const guildPrompt = await GetGuildPrompt(
						interaction.guild.id
					);
					if (guildPrompt) {
						x.push(`S Guild Default -> ${guildPrompt}`);
					}
				}

				await interaction.reply({
					flags: [MessageFlags.Ephemeral],
					content: x.join("\n")
				});
				break;
			}
			default: {
				await interaction.reply({
					flags: [MessageFlags.Ephemeral],
					content: "invalid opt"
				});
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
					flags: [MessageFlags.Ephemeral]
				});
			} else if (action === "remove") {
				await RemoveChannelAIWhitelist(channel.id);
				return interaction.reply({
					content: `Successfully unwhitelisted <#${channel.id}>.`,
					flags: [MessageFlags.Ephemeral]
				});
			} else {
				return interaction.reply({
					content: "error.",
					flags: [MessageFlags.Ephemeral]
				});
			}
		} catch (error) {
			return interaction.reply({
				content: `Error: ${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}

	public async chatInputAddGbanProvider(
		interaction: Command.ChatInputCommandInteraction
	) {
		const handlerId = interaction.options.getString("handler_id", true);

		try {
			const existingProvider = await prisma.gbanSyncKey.findUnique({
				where: { handlerId }
			});

			if (existingProvider) {
				return interaction.reply({
					content: `> A GBan provider with the handler ID \`${handlerId}\` already exists.`,
					flags: [MessageFlags.Ephemeral]
				});
			}

			const apiKey = randomBytes(32).toString("hex");

			await prisma.gbanSyncKey.create({
				data: {
					handlerId,
					key: apiKey
				}
			});

			return interaction.reply({
				content: `> Successfully added GBan provider \`${handlerId}\` with API key: \`${apiKey}\`.`,
				flags: [MessageFlags.Ephemeral]
			});
		} catch (error) {
			return interaction.reply({
				content: `> Error adding GBan provider: ${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}

	public async chatInputRemoveGbanProvider(
		interaction: Command.ChatInputCommandInteraction
	) {
		const handlerId = interaction.options.getString("handler_id", true);
		const deleteBans = interaction.options.getBoolean("delete_bans") ?? false;

		try {
			if (deleteBans) {
				// Delete all bans associated with the provider
				const deletedBans = await prisma.robloxUserBan_ThirdPartyFed.deleteMany({
					where: { banHandlerId: handlerId }
				});

				await interaction.reply({
					content: `> Deleted ${deletedBans.count} bans associated with GBan provider \`${handlerId}\`.`,
					flags: [MessageFlags.Ephemeral]
				});
			}

			// Delete the provider itself
			const deletedProvider = await prisma.gbanSyncKey.delete({
				where: { handlerId }
			});

			return interaction.followUp({
				content: `> Successfully removed GBan provider \`${deletedProvider.handlerId}\`.`,
				flags: [MessageFlags.Ephemeral]
			});
		} catch (error) {
			return interaction.reply({
				content: `> Error removing GBan provider: ${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}

	public async chatInputResetGbanKey(
		interaction: Command.ChatInputCommandInteraction
	) {
		const handlerId = interaction.options.getString("handler_id", true);

		try {
			const newApiKey = randomBytes(32).toString("hex");

			const updatedProvider = await prisma.gbanSyncKey.update({
				where: { handlerId },
				data: { key: newApiKey }
			});

			return interaction.reply({
				content: `> Successfully reset API key for GBan provider \`${updatedProvider.handlerId}\`. New API key: \`${newApiKey}\`.`,
				flags: [MessageFlags.Ephemeral]
			});
		} catch (error) {
			return interaction.reply({
				content: `> Error resetting API key: ${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}
}

export default SlashCommand;
