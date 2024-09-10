import { ApplicationCommandRegistries, Command, CommandStore, RegisterBehavior, SapphireClient, Store } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits } from 'discord.js';
import { getDistroNameSync } from '../../lib/Utility';

const logger = require('pino')()

// fucking magic
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

export const client = new SapphireClient({
	intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
	defaultPrefix: "!",
	loadMessageCommandListeners: true,
	caseInsensitiveCommands: true,
	caseInsensitivePrefixes: true,
	presence: {
		activities: [
			{
				name: `${getDistroNameSync()} ${process.arch}`,
				type: ActivityType.Playing
			}
		]
	}
})
