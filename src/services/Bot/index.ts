import { Logger } from "pino";
import { client } from "./bot";
import { InitSentry } from "@112/SentryUtil";
import { logger } from "@112/Utility";

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
			this.logger.child({ error: e_ }).fatal("Bot threw a FATAL exception!");
			this.logger.fatal("You might have given 112 an invalid token!");
			this.logger.fatal(
				"If the gateway did not send OP_HELLO in time, Discord has an outage!"
			);
			process.exit(1);
		});
	}
}

export const Service = new BotService(require("pino")({
	base: {
		pid: "bot"
	}
}));

export async function StartService(): Promise<void> {
	logger.info("LATE-STAGE SENTRY INIT");
	InitSentry();
	await Service._StartService();
}
