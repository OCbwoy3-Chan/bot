import { Logger } from "pino";
import { client, loadAllCommands } from "./bot";
import { infoCommand } from "../../locale/commands";

class BotService {
	constructor(private readonly logger: Logger) {};

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info(await infoCommand.genContent())
		this.logger.info("Registering all commands");
		await loadAllCommands()
		this.logger.info("Starting Discord Bot");
		client.login(process.env.DISCORD_TOKEN).catch(()=>{
			this.logger.info("Bot threw an exception!");
			process.exit(1)
		})
	}
}

export const Service = new BotService(require('pino')());

export async function StartService(): Promise<void> {
	await Service._StartService();
}
