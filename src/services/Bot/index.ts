import { Logger } from "pino";
import { client } from "./bot";

class BotService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting Discord Bot");
		if (!process.env.DISCORD_TOKEN || !process.env.OWNER_ID) {
			this.logger.fatal(
				"You did not provide a Token or a Bot Owner ID in your .env!"
			);
			process.exit(1);
		}
		client.login(process.env.DISCORD_TOKEN).catch((e_) => {
			this.logger.child({ error: e_ }).fatal("Bot threw an exception!");
			this.logger.fatal("You might have given 112 an invalid token!");
			this.logger.fatal(
				"If the gateway did not send OP_HELLO in time, Discord has an outage!"
			);
			process.exit(1);
		});
	}
}

export const Service = new BotService(require("pino")());

export async function StartService(): Promise<void> {
	await Service._StartService();
}
