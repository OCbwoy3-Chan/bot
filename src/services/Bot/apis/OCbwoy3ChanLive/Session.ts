import {
	AudioReceiveStream,
	createAudioResource,
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

const ai = getGeminiInstance();
const player = live.getPlayer();

class PCMStreamMixer extends Transform {
	private streams: opus.Decoder[] = [];
	constructor() {
		super();
	}

	addStream(stream: opus.Decoder) {
		this.streams.push(stream);
		stream.on("data", (chunk) => {
			this.push(chunk);
		});
		stream.on("end", () => {
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

	constructor(private connection: VoiceConnection) {}

	public async beginSession(model: string = "gemini-2.0-flash-live-001") {
		assert(this.connection);
		assert(!this.session);

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
				},
				onmessage: (e) => {
					if (e.goAway) {
						live.getChannel()?.send({
							content: `**Disconnecting from Live Server in ${e.goAway.timeLeft}.**`
						})
					}
					console.log(e);
				},
				onerror: (e: ErrorEvent) => {
					console.log(e);
				},
				onclose: (e: CloseEvent) => {
					live.playAudio("stop.mp3")
					console.log("Connection closed.");
				}
			}
		});

		const resource = createAudioResource(this.mixer, {
			inputType: StreamType.Raw
		});
		player.play(resource);
		this.connection.subscribe(player)

		live.getChannel()!.members.forEach((a) => {
			if (a.user.bot) return;
			if (a.user.id == client.user!.id) return;

			const sub = this.connection.receiver.subscribe(a.id);

			const decoder = new opus.Decoder({
				frameSize: 960,
				channels: 2,
				rate: 48000
			});
			const pcmStream = sub.pipe(decoder);

			const resource = createAudioResource(pcmStream, {
				inputType: StreamType.Raw
			});
			player.play(resource);
			this.connection.subscribe(player)

			this.mixer.addStream(pcmStream);
			this.subscriptions.push(sub);
		});
	}
}
