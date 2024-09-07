import { ApplicationCommandRegistries, Command, CommandStore, SapphireClient, Store } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

let logger = require('pino')()

export const client = new SapphireClient({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    defaultPrefix: "!",
    loadMessageCommandListeners: true,
    caseInsensitiveCommands: true,
    caseInsensitivePrefixes: true,
})