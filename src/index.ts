import { configDotenv } from "dotenv";
configDotenv();

import { exec } from "child_process";
import figlet from "figlet";
import { Logger } from "pino";
const logger: Logger = require("pino")({
	base: {
		pid: "init"
	}
});

const SERVICE_LOAD_ORDER = ["Database", "Server", "GenAI", "Bot"];

exec("clear");
console.clear();

async function loadServices() {
	for (var service of SERVICE_LOAD_ORDER) {
		logger.info(`Loading service "${service}"`);
		try {
			const mod = require(`./services/${service}`);
			await new Promise((resolve) => setTimeout(resolve, 100));
			await mod.StartService();
			await new Promise((resolve) => setTimeout(resolve, 100));
			logger.info(`Successfully loaded service: "${service}"`);
		} catch (e) {
			logger
				.child({ service: service, err: e })
				.error(`Error loading service "${service}"`, e);
		}
	}
	logger.info(`112 loaded successfully!`);
}

async function printFiglet(a: string, b: figlet.Fonts): Promise<string> {
	const t = (await figlet(a, b)) as any as string;
	return t.replace(/[\n ]*$/, "") + "\n";
}

(async () => {
	console.log(await printFiglet("ocbwoy3 . dev", "Big"));
	loadServices();
})();
