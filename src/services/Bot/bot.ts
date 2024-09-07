import { ApplicationCommandRegistries, Command, CommandStore, SapphireClient, Store } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

let logger = require('pino')()

export const client = new SapphireClient({
  intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  loadMessageCommandListeners: true
//   logger: {instance: require('pino')() }
});

export async function loadAllCommands(): Promise<void> {
	const commandFolder = join(__dirname,"commands/")
	const allFiles = readdirSync(commandFolder)
	allFiles.forEach(async(filename:string)=>{
		if (filename.endsWith(".js")) {
			const moduleName = filename.replace(/\.js$/,'')
			logger.info(`Loading command "${moduleName}"`);
			try {
				const mod: any = require(join(__dirname,"commands",moduleName));

				const registry = ApplicationCommandRegistries.acquire(moduleName);

				const loaderOpts: Command.LoaderContext = {
					root: commandFolder,
					path: filename,
					name: moduleName,
					store:
				}

				const options: Command.Options = {
					name: moduleName
				}

				const command = new mod.SlashCommand(loaderOpts, options)


				await command.registerApplicationCommands(registry)

				// registry.registerChatInputCommand({
				// 	name: moduleName,
				// 	description: 'Sends a uwu in chat'
				// });

				logger.info(`Successfully loaded command: "${moduleName}"`);
			} catch (e) {
				logger.child({ command: moduleName, err: e }).error(`Error loading command "${moduleName}"`, e);
			}
		}
	})
	console.log(allFiles)
}
