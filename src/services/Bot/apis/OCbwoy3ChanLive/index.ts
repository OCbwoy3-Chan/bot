import {
	joinVoiceChannel,
	createAudioPlayer,
	VoiceConnection,
	createAudioResource,
	VoiceConnectionStatus,
	entersState,
	PlayerSubscription,
	AudioPlayer
} from "@discordjs/voice";
import { container } from "@sapphire/framework";
import { ChannelType, VoiceChannel } from "discord.js";
import { join } from "path";

const rootAudioPath = join(
	__dirname,
	"..",
	"..",
	"..",
	"..",
	"..",
	"media",
	"MultimodalSfx"
);

class OCbwoy3ChanLive {
	private player = createAudioPlayer();
	private connection: VoiceConnection | null = null;

	private subscription: PlayerSubscription | null | undefined = null;
	private ch: VoiceChannel | null = null;

	public async joinChannel(channelId: string) {
		const { client, logger } = container;

		logger.info(`Attempting to join channel: ${channelId}`);

		const guild = client.guilds.cache.find((g) =>
			g.channels.cache.has(channelId)
		);

		if (!guild) {
			logger.error("Guild with the target channel not found.");
			return "Guild not found.";
		}

		const channel = guild.channels.cache.get(channelId) as VoiceChannel;

		if (!channel || channel.type !== ChannelType.GuildVoice) {
			logger.error("Target channel is not a valid voice channel.");
			return "Invalid voice channel.";
		}

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
			selfMute: false,
			selfDeaf: false
		});
		this.ch = channel;

		this.connection.setMaxListeners(999);

		this.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
			try {
				await Promise.race([
					entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
					entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
				]);
				// Seems to be reconnecting to a new channel - ignore disconnect
			} catch {
				// Seems to be a real disconnect which SHOULDN'T be recovered from
				this.connection?.destroy();
				this.connection?.removeAllListeners();
			}
		});

		return `Joined channel: ${channel.name}`;
	}

	public leaveChannel() {
		if (this.connection) {
			this.connection.destroy();
			this.connection = null;
			this.ch = null;
			container.logger.info("Left the voice channel.");
			return "Left the voice channel.";
		} else {
			container.logger.warn("No active voice connection to leave.");
			return "No active voice connection.";
		}
	}

	public getChannel(): VoiceChannel | null {
		return this.ch
	}

	public getPlayer(): AudioPlayer {
		return this.player
	}

	public getConnection(): VoiceConnection | null {
		return this.connection
	}

	public playAudio(sound: string) {
		if (!this.connection) {
			container.logger.error("No active voice connection.");
			return;
		}

		const audioFilePath = join(rootAudioPath, sound); // Replace with actual path
		let resource = createAudioResource(audioFilePath);

		this.player.play(resource);
		this.connection.subscribe(this.player);

		this.player.on("error", (error) => {
			container.logger.error(`Audio player error: ${error.message}`);
		});
	}
}

export default new OCbwoy3ChanLive();
