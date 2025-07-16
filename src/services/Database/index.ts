import { Logger } from "pino";
import { RefreshAllBanlands } from "../../lib/BanlandCacheHelper";
import { prisma } from "./db";
import { loadAllGbanProviders, loadAllInstances } from "./federation";
import { runAutoUnban } from "./helpers/AutoUnbanHelper";
import { BanlandCheckInterval } from "@112/Constants";

class DatabaseService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting DB");
		await RefreshAllBanlands();
		await loadAllGbanProviders();
		await loadAllInstances();
		process.on("beforeExit", async () => {
			await prisma.$disconnect();
		});
		setInterval(async () => {
			// this.logger.info("Refreshing banland automatically");
			await RefreshAllBanlands();
		}, 5000);
		setInterval(async () => {
			await runAutoUnban();
		}, BanlandCheckInterval);
	}
}

export const Service = new DatabaseService(
	require("pino")({
		base: {
			pid: null
		},
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true
			}
		}
	})
);

export async function StartService(): Promise<void> {
	await Service._StartService();
}
