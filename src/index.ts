import { Logger } from "pino";
const logger: Logger = require('pino')();

console.log("112 - SB Toolkit by OCbwoy3");
require("dotenv").configDotenv(); // chad workaround typescript

const SERVICE_LOAD_ORDER = ["Bot"];

async function loadServices() {
	for (var service of SERVICE_LOAD_ORDER) {
		logger.info(`Loading service "${service}"`);
		try {
			const mod = require(`./services/${service}`);
			await new Promise(resolve=>setTimeout(resolve,100));
			await mod.StartService();
			await new Promise(resolve=>setTimeout(resolve,100));
			logger.info(`Successfully loaded service: "${service}"`);
		} catch (e) {
			logger.child({ service: service, err: e }).error(`Error loading service "${service}"`, e);
		}
	}
	logger.info(`112 loaded successfully!`);
}

loadServices()
