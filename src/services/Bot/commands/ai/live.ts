import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	ChannelType,
	InteractionContextType
} from "discord.js";
import { IsAIWhitelisted } from "../../../Database/helpers/AIWhitelist";
import { r } from "112-l10n";
import { AllVoiceModels } from "@ocbwoy3chanai/gemini";

import OCbwoy3ChanLive from "../../apis/OCbwoy3ChanLive";
import { LiveSession } from "services/Bot/apis/OCbwoy3ChanLive/Session";
import { logger } from "@112/Utility";
import { sleep } from "bun";

let CurrentLiveSession: LiveSession | null = null;

class LiveCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Live Multimodal API Tools",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "join",
					chatInputRun: "chatInputJoin"
				},
				{
					name: "leave",
					chatInputRun: "chatInputLeave"
				},
				{
					name: "action",
					chatInputRun: "chatInputAction"
				},
				{
					name: "set_model",
					chatInputRun: "chatInputSetModel"
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(InteractionContextType.Guild)
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
				.addSubcommand((builder) =>
					builder
						.setName("join")
						.setDescription("Join a specified channel")
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription("The channel to join")
								.setRequired(true)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("leave")
						.setDescription("Leave the current channel")
				)
				.addSubcommand((builder) =>
					builder
						.setName("action")
						.setDescription("Perform an action")
						.addStringOption((option) =>
							option
								.setName("type")
								.setDescription("The action to perform")
								.setRequired(true)
								.addChoices(
									{ name: "Connect", value: "start" },
									{ name: "Disconnect", value: "stop" },
									{ name: "Pause", value: "pause" },
									{ name: "Resume", value: "resume" }
								)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName("set_model")
						.setDescription("Set the model for the API")
						.addStringOption((option) =>
							option
								.setName("model")
								.setDescription("The model to set")
								.setRequired(true)
								.addChoices(
									...Object.entries(AllVoiceModels).map(
										([a, b]) => ({ name: a, value: b })
									)
								)
						)
				)
		);
	}

	public async chatInputJoin(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		const channel = interaction.options.getChannel("channel", true);

		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}

		if (channel.type !== ChannelType.GuildVoice) {
			return await interaction.reply({
				content: "Not a VC!",
				ephemeral: true
			});
		}

		const result = await OCbwoy3ChanLive.joinChannel(channel.id);

		return await interaction.reply({
			content: result,
			ephemeral: false
		});
	}

	public async chatInputLeave(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}

		if (CurrentLiveSession) {
			return await interaction.reply({
				content: "Session still active.",
				ephemeral: true
			});
		}

		try {
			const result = OCbwoy3ChanLive.leaveChannel();

			return await interaction.reply({
				content: result,
				ephemeral: false
			});
		} catch (error) {
			if ((error as any).code === "ERR_STREAM_PREMATURE_CLOSE") {
				logger.warn(
					"Error during leave session: Stream prematurely closed."
				);
			} else {
				logger.error("Unexpected error during leave session:", error);
			}
			return await interaction.reply({
				content: "An error occurred while leaving the session.",
				ephemeral: true
			});
		}
	}

	public async chatInputAction(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		const action = interaction.options.getString("type", true);

		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}

		try {
			switch (action) {
				case "start":
					if (!OCbwoy3ChanLive.getChannel()) {
						return await interaction.reply({
							content:
								"Bot is not in a voice channel. Use `/live join` first.",
							ephemeral: true
						});
					}

					await interaction.deferReply({
						fetchReply: true,
						ephemeral: true
					});

					const connection = OCbwoy3ChanLive.getConnection();
					if (!connection) {
						return await interaction.reply({
							content: "Failed to retrieve voice connection.",
							ephemeral: true
						});
					}

					let sessionx = new LiveSession(connection);
					sessionx.beginSession();

					CurrentLiveSession = sessionx;

					await interaction.followUp({
						content: "Session started! (Hopefully)",
						ephemeral: false
					});
					break;

				case "stop":
					if (!CurrentLiveSession) {
						return await interaction.reply({
							content: "No live session.",
							ephemeral: true
						});
					}
					CurrentLiveSession.endSession();
					CurrentLiveSession = null;
					break;

				case "pause":
					// OCbwoy3ChanLive.getPlayer().pause();
					break;

				case "resume":
					const channel = interaction.guild!.channels.cache.find(
						(a) => a.type === ChannelType.GuildVoice
					);

					if (!channel) {
						return await interaction.reply({
							content: "No VC :(",
							ephemeral: true
						});
					}

					const result = await OCbwoy3ChanLive.joinChannel(
						channel.id
					);

					await sleep(1000);

					const connectionxx = OCbwoy3ChanLive.getConnection();

					let sessionxx = new LiveSession(connectionxx!);
					sessionxx.beginSession();

					CurrentLiveSession = sessionxx;
					// OCbwoy3ChanLive.getPlayer().unpause();
					break;

				default:
					return await interaction.reply({
						content: "Invalid action type.",
						ephemeral: true
					});
			}
		} catch (e_) {
			return await interaction.reply({
				content: `> # Action error (${action})\n> ${e_}`,
				ephemeral: true
			});
		}

		// Simulate performing the action
		return await interaction.reply({
			content: `dummy action execution feedback: ${action}\ntbd`,
			ephemeral: true
		});
	}

	public async chatInputSetModel(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		const model = interaction.options.getString("model", true);

		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: await r(interaction, "ai:missing_wl"),
				ephemeral: true
			});
		}

		// Simulate setting the model
		return await interaction.reply({
			content: `Model set to: ${model}`,
			ephemeral: false
		});
	}
}

export default LiveCommand;
