import { Logger } from "pino";
import { prisma } from "./db";
import { RefreshAllBanlands } from "../../lib/BanlandCacheHelper";
import { loadAllInstances } from "./federation";

class DatabaseService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting DB");
		await RefreshAllBanlands();
		await loadAllInstances();
		process.on("beforeExit", async () => {
			await prisma.$disconnect();
		});
		setInterval(async () => {
			// this.logger.info("Refreshing banland automatically");
			await RefreshAllBanlands();
		}, 10000);
	}
}

export const Service = new DatabaseService(require("pino")());

export async function StartService(): Promise<void> {
	await Service._StartService();
}
