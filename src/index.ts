import { configDotenv } from "dotenv";
configDotenv();

import { exec, execSync } from "child_process";
import figlet from "figlet";
import { Logger } from "pino";
import chalk from "chalk";
const logger: Logger = require("pino")({
	base: {
		pid: "init"
	}
});

declare global {
	var NODE_ENV: string | "development" | "production";
}

const SERVICE_LOAD_ORDER = ["Database", "Server", "GenAI", "Bot"];

exec("cls");
exec("clear");
console.clear();

async function loadServices() {
	for (const service of SERVICE_LOAD_ORDER) {
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
	const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
	const version = execSync("git describe --tags").toString().trim();
	const commit = execSync("git rev-parse HEAD").toString().trim();

	process.stdout.write(`\x1b]2;ocbwoy3.dev - ${branch}@${commit.slice(0,6)} (${version})\x1b\x5c`);
	console.log(await printFiglet("ocbwoy3 . dev", "Big"));
	if (process.platform !== "linux" && process.platform !== "darwin") {
		if (process.platform === "win32") {
			console.log(chalk.redBright.bold("WARNING - Windows is not supported, you may run into issues."))
		} else {
			console.log(chalk.redBright.bold(`WARNING - Your platform (${process.platform}) is not supproted, you may run into issues.`))
		}
	}
	loadServices();
})();
