import {
	ApplicationCommandRegistries, RegisterBehavior,
	SapphireClient
} from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { _setIsFork } from "../../lib/Utility";
import { setPresence } from "../Server/router/stats";
import { hostname } from "os";
import { captureSentryException } from "@112/SentryUtil";

const logger = require("pino")({
	base: {
		pid: "bot"
	}
});

// fucking magic
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
	RegisterBehavior.BulkOverwrite
);

export const client = new SapphireClient({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.Guilds,
	],
	partials: [
		Partials.Channel,
		Partials.GuildMember,
		Partials.GuildScheduledEvent,
		Partials.Message,
		Partials.Reaction,
		Partials.ThreadMember,
		Partials.User
	],
	defaultPrefix: "!",
	loadMessageCommandListeners: true,
	caseInsensitiveCommands: true,
	caseInsensitivePrefixes: true,
	logger: {
		instance: new PinoLogger({
			name: "bot",
			formatters: {
				bindings: () => ({ pid: `bot` }),
			},
		}),
	},
	presence: {
		status: "dnd",
		activities: [
			{
				name: `AT Protocol`,
				state: "Bluesky Social - @ocbwoy3.dev",
				type: ActivityType.Playing,
			},
		],
	},
});

client.once("ready", () => {
	logger.info("Logged in");
	if (client.user!.id === "1271869353389723738") {
		_setIsFork(false);
		if (hostname() === "ocbwoy3-pc") {
			_setIsFork(true);
		}
	}
});

client.on("error",(err)=>{
	if (err.message && !err.message.includes("webhook")) {
		captureSentryException(err)
	}
});

setInterval(async () => {
	if (!process.env.GUILD_ID) return;
	try {
		const g = await client.guilds.resolve(process.env.GUILD_ID!);
		if (!g) {
			await client.guilds.fetch(process.env.GUILD_ID!);
			return;
		}
		const m = g.members.resolve(process.env.OWNER_ID!);
		if (!m) {
			await g.members.fetch(process.env.OWNER_ID!);
			return;
		}
		setPresence(m.presence?.toJSON() || null);
	} catch {}
}, 100);
