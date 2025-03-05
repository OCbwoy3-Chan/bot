import { Logger } from "pino";
import { ServerPort } from "../../lib/Constants";
import { app } from "./routes";

class ServerService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		this.logger.info("Starting Webserver");
		app.listen(ServerPort, () => {
			this.logger.info(
				`Started server on port ${ServerPort} | http://127.0.0.1:${ServerPort}`
			);
		});
	}
}

export const Service = new ServerService(require("pino")({
	base: {
		pid: "server"
	}
}));

export async function StartService(): Promise<void> {
	await Service._StartService();
}
