import {
	AudioPlayerStatus,
	AudioReceiveStream,
	createAudioResource,
	EndBehaviorType,
	StreamType,
	VoiceConnection
} from "@discordjs/voice";
import { Modality, Session } from "@google/genai";
import assert from "assert";

import live from ".";
import { getGeminiInstance } from "@ocbwoy3chanai/gemini";
import { GetChannelPrompt, GetGuildPrompt } from "@db/helpers/AISettings";
import { getPrompt } from "@ocbwoy3chanai/prompt/GeneratePrompt";
import { opus } from "prism-media";
import { client } from "services/Bot/bot";
import { Transform } from "stream";
import { OpusEncoder } from "@discordjs/opus";
import { createMutex } from "@112/Mutex";
import { sleep } from "bun";

const ai = getGeminiInstance();
const player = live.getPlayer();

const decoder = new OpusEncoder(48000, 2);

class PCMStreamMixer extends Transform {
	private streams: opus.Decoder[] = [];
	constructor() {
		super();
		this.on("error", (err) => {
			if ((err as any).code === "ERR_STREAM_PREMATURE_CLOSE") {
				console.warn(
					"PCMStreamMixer: Stream prematurely closed:",
					err.message
				);
			} else {
				console.error("PCMStreamMixer: Unexpected error:", err);
			}
		});
	}

	removeAllStreams() {
		this.streams.forEach((a) => {
			try {
				a.destroy();
			} catch (err) {
				console.error("Error destroying stream:", err);
			}
		});
		this.streams = [];
	}

	addStream(stream: opus.Decoder) {
		this.streams.push(stream);
		stream.on("data", (chunk) => {
			this.push(chunk);
		});
		stream.on("end", () => {
			this.streams = this.streams.filter((s) => s !== stream);
		});
		stream.on("error", (err) => {
			if ((err as any).code === "ERR_STREAM_PREMATURE_CLOSE") {
				console.warn("Stream prematurely closed:", err.message);
			} else {
				console.error("Stream error:", err);
			}
		});
	}

	_transform(chunk: any, encoding: any, callback: any) {
		callback(null, chunk);
	}
}

export class LiveSession {
	private session: Session | null = null;
	private subscriptions: AudioReceiveStream[] = [];
	private mixer = new PCMStreamMixer();

	private plsDie: boolean = false;

	constructor(private connection: VoiceConnection) {}

	public async beginSession(model: string = "gemini-2.0-flash-live-001") {
		assert(this.connection, "No VC :(");
		assert(!this.session, "Session already exists, dummy");

		if (this.session) throw "Session already active!";

		const ch = live.getChannel();
		assert(ch);

		let prompt = "google/base";
		const channelPrompt = await GetChannelPrompt(ch.id);
		if (channelPrompt) {
			prompt = channelPrompt;
		} else if (ch.guild) {
			const guildPrompt = await GetGuildPrompt(ch.guild.id);
			if (guildPrompt) {
				prompt = guildPrompt;
			}
		}

		const mt = createMutex();

		this.session = await ai.live.connect({
			model: model,
			config: {
				responseModalities: [Modality.AUDIO],
				systemInstruction: {
					parts: [
						{
							text: getPrompt(prompt)!.toString()
						}
					],
					role: "system"
				}
			},
			callbacks: {
				onopen: () => {
					live.playAudio("start.mp3");
					live.getChannel()?.send({
						content: `**Started Live Chat.**`
					});
					setTimeout(() => {
						mt.resolve();
					}, 1500);
				},
				onmessage: (e) => {
					if (e.goAway) {
						live.getChannel()?.send({
							content: `**Disconnecting from Live Server in ${e.goAway.timeLeft}.** (GoAway message received from server)`
						});
					}
					console.log(e);
				},
				onerror: (e: ErrorEvent) => {
					console.log(e);
				},
				onclose: (e: CloseEvent) => {
					live.playAudio("stop.mp3");
					live.getChannel()?.send({
						content: `**Live Chat ended.**`
					});
				}
			}
		});

		await mt.await();

		const resource = createAudioResource(this.mixer, {
			inputType: StreamType.Raw,
			silencePaddingFrames: Number.MAX_VALUE
		});
		player.play(resource);
		this.connection.subscribe(player);

		// Restart playback when it ends
		player.on(AudioPlayerStatus.Idle, (s) => {
			console.log("Playback ended, restarting...");
			const resource = createAudioResource(this.mixer, {
				inputType: StreamType.Raw,
				silencePaddingFrames: Number.MAX_VALUE
			});
			player.play(resource);
		});

		const activeUsers = new Set<string>();

		this.connection.receiver.speaking.on("start", (userId: string) => {
			if (this.plsDie) return;
			if (userId === client.user!.id || activeUsers.has(userId)) return;
			// console.warn(userId, 'add');

			activeUsers.add(userId);

			const sub = this.connection.receiver.subscribe(userId, {
				end: {
					behavior: EndBehaviorType.AfterSilence, // Ensure the stream ends only after silence
					duration: 1000 // Optional: Adjust silence duration threshold (in ms)
				}
			});

			const onData = (a: Buffer) => {
				try {
					this.mixer.write(decoder.decode(a));
					// console.log(a.toString("hex"))
				} catch (err) {
					console.error(
						`Error decoding audio for user ${userId}:`,
						err
					);
				}
			};

			sub.on("data", onData);

			const onEnd = (endedUserId: string) => {
				if (endedUserId === userId || this.plsDie === true) {
					// console.warn(userId, 'remove');
					sub.off("data", onData); // Remove the 'data' listener
					sub.destroy(); // Destroy the subscription
					this.connection.receiver.speaking.off("end", onEnd); // Remove the 'end' listener
					activeUsers.delete(userId); // Remove the user from the active set
				}
			};

			this.connection.receiver.speaking.on("end", onEnd);
		});
	}

	public async endSession() {
		assert(!!this.session);
		this.plsDie = true;
		this.session?.close();
		await sleep(1500);
		this.connection.receiver.speaking.removeAllListeners();
		this.mixer.removeAllListeners();
		this.mixer.removeAllStreams();
		this.subscriptions.forEach((a) => {
			try {
				a.removeAllListeners();
			} catch {}
			try {
				a.destroy(new Error("OCbwoy3-Chan Live Session closed"));
			} catch {}
		});
		this.connection.removeAllListeners();
	}
}
