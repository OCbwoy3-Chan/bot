import "@sapphire/plugin-i18next/register";
import {
	ApplicationCommandRegistries,
	RegisterBehavior,
	SapphireClient
} from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { ActivityType, GatewayIntentBits, Guild, Partials } from "discord.js";
import { _setIsFork } from "../../lib/Utility";
import { hostname } from "os";
import { captureSentryException } from "@112/SentryUtil";
import { setPresence } from "services/Server/router/stats";
import { InternationalizationContext } from "@sapphire/plugin-i18next";
import { prisma } from "@db/db";
import { join } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { ALL_LANGUAGES } from "112-l10n";

const logger = require("pino")({
	base: {
		pid: "bot"
	}
});

// fucking magic
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
	RegisterBehavior.BulkOverwrite
);

const cachedGuildLanguages: { [guild: string]: string } = {};

export function _clearCachedGuildLang(id: string) {
	delete cachedGuildLanguages[id];
}

function loadTranslations() {
	const languages = ALL_LANGUAGES.map((a) => a.id);
	const resources: Record<string, any> = {};

	for (const lang of languages) {
		const langDir = join(__dirname, `languages/${lang}`);
		const files = readdirSync(langDir);
		resources[lang] = {};

		for (const file of files) {
			const filePath = join(langDir, file);
			if (file.endsWith(".json")) {
				const fileContents = readFileSync(filePath, "utf8");
				const fileName = file.replace(".json", "");
				resources[lang][fileName] = JSON.parse(fileContents);
			}
		}

		const aiHelpMsgPath = join(langDir, "ai_help_msg.txt");
		if (existsSync(aiHelpMsgPath)) {
			const content = readFileSync(aiHelpMsgPath, "utf-8");
			resources[lang].ai.help_msg = content.replace(/ \/\/\*.*$/im, "");
			// console.log(content.replace(/ \/\/\*.*$/im,""));
		}
	}

	return resources;
}

export const client = new SapphireClient({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.Guilds
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
				bindings: () => ({ pid: `bot` })
			}
		})
	},
	presence: {
		status: "dnd",
		activities: [
			/*
			{
				name: "skids vanish into thin air",
				state: "another one bites the dust",
				type: ActivityType.Watching,
			}
			*/
			{
				name: ".gg/yokstar",
				state: "w server",
				type: ActivityType.Listening
			}
		]
	},
	i18n: {
		defaultName: "en",
		i18next: {
			fallbackLang: "en",
			debug: hostname() === "ocbwoy3-pc" ? true : false,
			returnObjects: true,
			resources: loadTranslations(),
			preload: ALL_LANGUAGES.map((a) => a.id)
		},
		fetchLanguage: async (context: InternationalizationContext) => {
			if (!context.guild) {
				if (context.user && context.user.id === "486147449703104523")
					return "lv";
				return "en";
			}

			if (!cachedGuildLanguages[context.guild.id]) {
				const guildSettings = await prisma.guildSetting.findFirst({
					where: {
						id: context.guild.id
					}
				});
				cachedGuildLanguages[context.guild.id] =
					guildSettings?.language || "en";
				return guildSettings?.language || "en";
			}
			return cachedGuildLanguages[context.guild.id];
		},
		defaultMissingKey: "generic:i18n_missing_key"
	} as any
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
	} catch {}
}, 100);

client.on("error", (err) => {
	if (err.message && !err.message.includes("webhook")) {
		captureSentryException(err);
	}
});
