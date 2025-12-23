import { Logger } from "pino";
import { GetGeminiTokens } from "@db/helpers/GeminiTokens";
import { setGeminiFallbackToken, setGeminiTokenPool } from "./gemini";

class GenAIService {
	constructor(private readonly logger: Logger) {}

	/* Starts the service */
	public async _StartService(): Promise<void> {
		const tokens = await GetGeminiTokens();
		if (tokens.length === 0 && !process.env.GEMINI_API_KEY) {
			this.logger.error(
				"No Gemini API tokens found in DB and GEMINI_API_KEY is not set, AI features will be disabled."
			);
			this.logger.error(
				"Get your API Key at https://aistudio.google.com/apikey"
			);
			return;
		}
		this.logger.info("Starting GenAI Service");
		setGeminiFallbackToken(process.env.GEMINI_API_KEY || null);
		if (tokens.length > 0) {
			this.logger.info(`Loaded ${tokens.length} Gemini token(s) from DB`);
			setGeminiTokenPool(tokens);
		}
	}
}

export const Service = new GenAIService(
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
