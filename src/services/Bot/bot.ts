import {
	ApplicationCommandRegistries, RegisterBehavior,
	SapphireClient
} from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { ActivityType, GatewayIntentBits, Guild, Partials } from "discord.js";
import { _setIsFork } from "../../lib/Utility";
import { hostname } from "os";
import { captureSentryException } from "@112/SentryUtil";
import { setPresence } from "services/Server/router/stats";

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
			// CHATGPT GENERATED STATUS
			{
				name: "skids vanish into thin air",
				state: "another one bites the dust",
				type: ActivityType.Watching,
			}
		],
	},
});

client.once("ready", async () => {
	logger.info("Logged in");
	if (client.user!.id === "1271869353389723738") {
		_setIsFork(false);
		if (hostname() === "ocbwoy3-pc") {
			_setIsFork(true);
		}
	}
});

let g: Guild | null = null;

setInterval(async () => {
	try {
		if (!g) {
			g = await client.guilds.resolve(process.env.GUILD_ID!);
			if (!g) {
				await client.guilds.fetch(process.env.GUILD_ID!);
				return;
			}
		}
	} catch {}
	try {
		if (!g) return;
		const m = g.members.resolve(process.env.OWNER_ID!);
		if (!m) {
			await g.members.fetch(process.env.OWNER_ID!);
			return;
		}
		setPresence(m.presence?.toJSON() || null);
	} catch { }
}, 100);

client.on("error", (err) => {
	if (err.message && !err.message.includes("webhook")) {
		captureSentryException(err)
	}
});

