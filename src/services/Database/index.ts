import { Logger } from "pino";
import { prisma } from "./db";

class BotService {
	constructor(private readonly logger: Logger) {};

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting DB");
		process.on("beforeExit",async()=>{
			await prisma.$disconnect()
		})
	}
}

export const Service = new BotService(require('pino')());

export async function StartService(): Promise<void> {
	await Service._StartService();
}
