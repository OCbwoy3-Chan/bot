import { Logger } from "pino";
import { client } from "./bot";

class BotService {
	constructor(private readonly logger: Logger) {};

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting Discord Bot");
		client.login(process.env.DISCORD_TOKEN).catch((e_)=>{
			this.logger.child({error: e_}).error("Bot threw an exception!");
			process.exit(1)
		})
	}
}

export const Service = new BotService(require('pino')());

export async function StartService(): Promise<void> {
	await Service._StartService();
}
