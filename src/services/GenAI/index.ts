import { Logger } from "pino";
import { initGemini } from "./gemini";

class GenAIService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		if (!process.env.GEMINI_API_KEY) {
			this.logger.error(
				{ pid: "genai" },
				"GEMINI_API_KEY is not set in process.env, AI features will be disabled."
			);
			this.logger.error(
				{ pid: "genai" },
				"Get your API Key at https://aistudio.google.com/apikey"
			);
			return;
		}
		this.logger.info({ pid: "genai" }, "Starting GenAI Service");
		initGemini(process.env.GEMINI_API_KEY);
	}
}

export const Service = new GenAIService(
	require("pino")({
		base: {
			pid: "genai"
		}
	})
);

export async function StartService(): Promise<void> {
	await Service._StartService();
}
