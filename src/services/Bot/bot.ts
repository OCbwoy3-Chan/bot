import {
	ApplicationCommandRegistries,
	RegisterBehavior,
	SapphireClient,
} from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { getDistroNameSync } from "../../lib/Utility";
import { setPresence } from "../Server/router/stats";

const logger = require("pino")();

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
		Partials.User,
	],
	defaultPrefix: "!",
	loadMessageCommandListeners: true,
	caseInsensitiveCommands: true,
	caseInsensitivePrefixes: true,
	logger: {
		instance: new PinoLogger({
			name: "sapphire",
			formatters: {
				bindings: () => ({ pid: `sapph` }),
			},
		}),
	},
	presence: {
		status: "idle",
		activities: [
			{
				name: `${getDistroNameSync()} ${process.arch}`,
				type: ActivityType.Playing,
			},
		],
	},
});

client.once("ready", () => {
	logger.info("Logged in");
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
