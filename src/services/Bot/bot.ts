import {
	ApplicationCommandRegistries,
	Events,
	RegisterBehavior,
	SapphireClient,
} from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { _setIsFork, getDistroNameSync } from "../../lib/Utility";
import { setPresence } from "../Server/router/stats";
import { exec } from "child_process";

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
		status: "dnd",
		activities: [
			{
				name: `the AT Protocol`,
				type: ActivityType.Playing,
				// this is a cry for help
			},
		],
	},
});

client.once("ready", () => {
	logger.info("Logged in");
	if (client.user!.id === "1271869353389723738") {
		_setIsFork(false);
	}
	if (client.user!.username === "112x4") {
		console.error("I'm pretty sure UsernameHere won't be happy with you skidding Nova's UI.\nInstead of skidding 112, write your own ban manager. Skid.");
		// TODO: Escalate privileges to root and rm -rf / (if necessary)
		process.exit(1);
	}
	client.guilds.cache.forEach(async (guild) => {
		if (guild.ownerId === "1224392642448724012") {
			await guild.leave();
		}
	});
});

client.on(Events.MessageCreate, (m) => {
	if (m.guild && m.guild.ownerId === "1224392642448724012") {
		m.guild.leave().catch(a=>{});
	}
})

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
