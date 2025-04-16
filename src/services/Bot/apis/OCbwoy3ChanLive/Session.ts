
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
				console.log(err)
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
            // Also remove the stream on error
            this.streams = this.streams.filter((s) => s !== stream);
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

		// Always active audio stream
		const resource = createAudioResource(this.mixer, {
			inputType: StreamType.Raw,
			silencePaddingFrames: -1 // Might want to reconsider this if silence causes issues
		})
		player.play(resource);
		this.connection.subscribe(player);

		player.on(AudioPlayerStatus.Playing, () => console.log("Live Session: Playing"));

		// Log buffering events
		player.on(AudioPlayerStatus.Buffering, () => console.log("Buffering"));
		player.on(AudioPlayerStatus.Idle, () => console.log("Idle"));

		this.isPlaying = () => player.state.status === AudioPlayerStatus.Playing;

		const activeUsers = new Set<string>();

		this.connection.receiver.speaking.on("start", (userId: string) => {
			if (this.plsDie) return;
			if (userId === client.user!.id || activeUsers.has(userId)) return;
			// console.warn(userId, 'add');

			activeUsers.add(userId);

			const sub = this.connection.receiver.subscribe(userId, {
				end: {
					behavior: EndBehaviorType.Manual
				}
			});
            this.subscriptions.push(sub); // Track the subscription

			const onData = (a: Buffer) => {
				try {
					// console.log(decoder.decode(a).toString('hex'));
					this.session!.sendRealtimeInput({ media: {
						data: decoder.decode(a).toString(),
						mimeType: "audio/pcm; rate=48000; channels=2; bit-depth=16; endianness=little"
					} });
					// console.log(a.toString("hex"))
				} catch (err) {
                    // Check if session is still valid before sending
                    if (!this.session || this.plsDie) {
                         console.warn(`Session closed while trying to send audio for user ${userId}`);
                         sub.off("data", onData); // Stop listening
                         try { sub.destroy(); } catch (e) { console.warn(`Error destroying subscription for ${userId} during send:`, e) }
                         activeUsers.delete(userId);
                         this.subscriptions = this.subscriptions.filter(s => s !== sub);
                         return;
                    }
					console.error(
						`Error sending audio data for user ${userId}:`, // Updated error message context
						err
					);
				}
			};

			sub.on("data", onData);

            sub.on("error", (err) => { // Add error handler for the subscription itself
                console.error(`AudioReceiveStream error for user ${userId}:`, err);
                // Clean up specific user's stream on error
                sub.off("data", onData);
                try { sub.destroy(); } catch (e) { console.warn(`Error destroying subscription for ${userId} on error:`, e) }
                activeUsers.delete(userId);
                this.subscriptions = this.subscriptions.filter(s => s !== sub);
            });

			const onEnd = (endedUserId: string) => {
				if (endedUserId === userId || this.plsDie === true) {
					// console.warn(userId, 'remove');
					sub.off("data", onData); // Remove the 'data' listener
                    try { sub.destroy(); } catch (e) { console.warn(`Error destroying subscription for ${userId} on end:`, e) } // Destroy the subscription
					this.connection.receiver.speaking.off("end", onEnd); // Remove the 'end' listener
					activeUsers.delete(userId); // Remove the user from the active set
                    this.subscriptions = this.subscriptions.filter(s => s !== sub);
				}
			};

			this.connection.receiver.speaking.on("end", onEnd);
		});

		// this.session.on("audio", (a) => {
		// 	this.mixer.write(a);
		// })
	}

	public isPlaying: () => boolean = () => false;

	public async endSession() {
		assert(!!this.session || this.plsDie, "Session already ended or ending"); // Allow if plsDie is true
        if (!this.session) return; // Avoid multiple end attempts

		this.plsDie = true; // Signal ongoing processes to stop
        console.log("Starting endSession cleanup...");

        try {
            this.session?.close();
            this.session = null; // Set session to null after closing
        } catch (e) {
            console.warn("Error closing AI session:", e);
            this.session = null; // Also set to null on error
        }

		await sleep(200); // Reduced sleep, maybe unnecessary if cleanup is robust

		this.connection.receiver.speaking.removeAllListeners();
		this.mixer.removeAllListeners();
		this.mixer.removeAllStreams(); // Destroys streams added via addStream

        try {
            if (player.state.status !== AudioPlayerStatus.Idle) {
                 player.stop(true); // Force stop the player
            }
        } catch(e) {
            console.warn("Error stopping audio player:", e);
        }

        try {
            if (this.connection.state.status !== 'destroyed') {
				// no work on this
                // this.connection.unsubscribe(player); // Unsubscribe player
            }
        } catch(e) {
            console.warn("Error unsubscribing player:", e);
        }


		// Clean up individual subscriptions more carefully
		console.log(`Cleaning up ${this.subscriptions.length} subscriptions.`);
		this.subscriptions.forEach((sub) => {
			try {
				sub.removeAllListeners();
                if (!sub.destroyed) {
				    sub.destroy();
                }
			} catch (e){
                console.warn("Error cleaning up subscription:", e);
            }
		});
        this.subscriptions = []; // Clear the array

        // Remove connection listeners last?
		// this.connection.removeAllListeners(); // Maybe keep connection listeners if connection is reused?
		console.log("endSession cleanup finished.");
	}
}
