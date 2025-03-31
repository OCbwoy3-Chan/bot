import { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	getVoiceConnection
} from "@discordjs/voice";
import { ChannelType, VoiceChannel } from "discord.js";

class VoiceCommand extends Subcommand {
	private player = createAudioPlayer();

	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			name: "dev-vc",
			description: "Commands to manage voice channel interactions.",
			preconditions: ["GuildOnly", "OwnerOnly"] as any[],
			subcommands: [
				{
					name: "join",
					chatInputRun: "chatInputJoin"
				},
				{
					name: "play",
					chatInputRun: "chatInputPlay"
				},
				{
					name: "leave",
					chatInputRun: "chatInputLeave"
				}
			]
		});
	}

	public async chatInputJoin(
		interaction: Command.ChatInputCommandInteraction
	) {
		const channelId = interaction.options.getChannel("channel", true).id;
		const channel = interaction.guild?.channels.cache.get(
			channelId
		) as VoiceChannel;

		if (!channel || channel.type !== ChannelType.GuildVoice) {
			return interaction.reply({
				content: "The provided channel is not a valid voice channel.",
				ephemeral: true
			});
		}

		joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		});

		return interaction.reply({
			content: `Joined ${channel.name}!`,
			ephemeral: true
		});
	}

	public async chatInputPlay(
		interaction: Command.ChatInputCommandInteraction
	) {
		const connection = getVoiceConnection(interaction.guildId!);

		if (!connection) {
			return interaction.reply({
				content: "I'm not in a voice channel. Use `/voice join` first.",
				ephemeral: true
			});
		}

		const url = interaction.options.getString("url", true);

		try {

			const resource = createAudioResource(url);
			this.player.play(resource);

			connection.subscribe(this.player);

			this.player.once(AudioPlayerStatus.Playing, () => {
				interaction.reply({
					content: `Now playing ${url}`,
					ephemeral: true
				});
			});

			this.player.once(AudioPlayerStatus.Idle, () => {
				interaction.followUp({
					content: "Finished playing.",
					ephemeral: true
				});
			});
		} catch (error) {
			return interaction.reply({
				content: "Failed to play the audio. Ensure the URL is valid.",
				ephemeral: true
			});
		}
	}

	public async chatInputLeave(
		interaction: Command.ChatInputCommandInteraction
	) {
		const connection = getVoiceConnection(interaction.guildId!);

		if (!connection) {
			return interaction.reply({
				content: "I'm not in a voice channel.",
				ephemeral: true
			});
		}

		connection.destroy();

		return interaction.reply({
			content: "Left the voice channel.",
			ephemeral: true
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("voice")
				.setDescription("Voice channel commands")
				.addSubcommand((command) =>
					command
						.setName("join")
						.setDescription("Joins a specified voice channel")
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription("The voice channel to join")
								.setRequired(true)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("play")
						.setDescription("Plays a song from a URL")
						.addStringOption((option) =>
							option
								.setName("url")
								.setDescription("The URL of the audio to play")
								.setRequired(true)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("leave")
						.setDescription("Leaves the current voice channel")
				)
		);
	}
}

export default VoiceCommand;
