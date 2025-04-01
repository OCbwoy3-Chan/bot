import {
	joinVoiceChannel,
	createAudioPlayer, AudioPlayerStatus,
	VoiceConnection,
	createAudioResource
} from "@discordjs/voice";
import { container, Listener } from "@sapphire/framework";
import { ChannelType, VoiceChannel } from "discord.js";
import { join } from "path";

export class InfiniteMusic extends Listener {
	private player = createAudioPlayer();
	private connection: VoiceConnection | null = null;
	private readonly audioFilePath = join(__dirname, "..", "..", "..", "..", "media", "$private", "teto.mp4")
	private readonly targetChannelId = "1354740148620754984";

	public constructor(
		context: Listener.LoaderContext,
		options: Listener.Options
	) {
		super(context, {
			...options,
			once: true,
			event: "ready"
		});
	}

	public async run() {
		const { client, logger } = container;

		if (client.user?.id !== "1271869353389723738") return;

		this.player.setMaxListeners(999);
		this.emitter?.setMaxListeners(999);

		logger.info("InfiniteMusic starting...");

		const guild = client.guilds.cache.find((g) =>
			g.channels.cache.has(this.targetChannelId)
		);

		if (!guild) {
			logger.error("Guild with the target channel not found.");
			return;
		}

		const channel = guild.channels.cache.get(
			this.targetChannelId
		) as VoiceChannel;

		if (!channel || channel.type !== ChannelType.GuildVoice) {
			logger.error("Target channel is not a valid voice channel.");
			return;
		}

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		});

		this.connection.setMaxListeners(999);

		this.playAudioLoop();
	}

	private playAudioLoop() {
		if (!this.connection) {
			container.logger.error("No active voice connection.");
			return;
		}

		const resource = createAudioResource(this.audioFilePath);

		this.player.play(resource);
		this.connection.subscribe(this.player);

		this.player.on(AudioPlayerStatus.Idle, () => {
			this.playAudioLoop();
		});

		this.player.on("error", (error) => {
			container.logger.error(`Audio player error: ${error.message}`);
		});
	}
}

export default InfiniteMusic;
