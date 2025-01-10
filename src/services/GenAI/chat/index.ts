import {
	ChatSession,
	FunctionCall,
	GenerateContentResult,
	GenerativeModel,
	HarmBlockThreshold,
	HarmCategory,
	Part,
} from "@google/generative-ai";
import { getToolMetas, getTools } from "./tools";
import { logger } from "../../../lib/Utility";
import { readdirSync } from "fs";
import crypto from "crypto";
import { getGeminiInstance, getSystemInstructionText } from "../gemini";
import { Channel, User } from "discord.js";

const files = readdirSync(`${__dirname}/AllTools`);

files.forEach((a) => {
	try {
		import(`${__dirname}/AllTools/${a}`);
	} catch (e_) {
		logger.child({ error: e_ }).error(a);
	}
});

export const tools = getTools();

export const toolMetas = getToolMetas();

export type AIContext = {
	askingUserId: string;
	chatbotUserId: string
	currentAiModel: string;
	currentChannel: string;
};

export class Chat {
	chatSession: ChatSession | null = null;
	callHistory: { [hash: string]: any } = {}; // Store previous calls

	constructor(
		public chatModel: string = "learnlm-1.5-pro-experimental",
		public prompt: string = "default.txt"
	) {
		const gemini = getGeminiInstance();

		const model = gemini.getGenerativeModel({
			model: chatModel,
			tools: [
				{
					functionDeclarations: toolMetas,
				},
			],
			safetySettings: [
				{
					category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
					threshold: HarmBlockThreshold.BLOCK_NONE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_HARASSMENT,
					threshold: HarmBlockThreshold.BLOCK_NONE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
					threshold: HarmBlockThreshold.BLOCK_NONE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
					threshold: HarmBlockThreshold.BLOCK_NONE,
				}
			],
			systemInstruction: getSystemInstructionText(prompt),
		});

		const generationConfig = {
			temperature: 1.5,
			topP: 0.95,
			topK: 40,
			maxOutputTokens: 8192,
			responseMimeType: "text/plain",
		};

		const chatSession = this.chatSession
			? this.chatSession
			: model.startChat({
					generationConfig,
					history: [],
			  });

		this.chatSession = chatSession;
	}

	private generateCallHash(funcName: string, args: any): string {
		const argsString = JSON.stringify(args);
		return crypto
			.createHash("md5")
			.update(`${funcName}${argsString}`)
			.digest("hex");
	}

	public async generateResponse(
		question: string | Array<string | Part>,
		ctx?: AIContext
	): Promise<[string, string[]]> {
		if (!this.chatSession) throw "No chat session present";

		logger.info(`User: ${question}`);

		let result: GenerateContentResult | null = null;
		let loopCount = 0;

		let toolsUsed: string[] = [];

		result = await this.chatSession.sendMessage([
			{
				text: "CurrentContext: "+JSON.stringify(ctx)
			},
			...question
		]);
		while (loopCount < 4) {
			try {
				logger.info(`AI (${loopCount} iter):`, result.response.text());
			} catch {
				throw `Response blocked by Google: ${JSON.stringify(result.response.promptFeedback)}`
			}
			loopCount++;

			if (!result.response.functionCalls()) break;
			if (result.response.functionCalls()?.length === 0) break;

			const functionCalls =
				result.response.functionCalls() as FunctionCall[];
			const functionResults = await Promise.all(
				functionCalls.map(async (funcCall) => {
					if (!toolsUsed.includes(funcCall.name)) {
						toolsUsed.push(funcCall.name);
					}
					const callHash = this.generateCallHash(
						funcCall.name,
						funcCall.args
					);

					if (this.callHistory[callHash]) {
						logger.info(
							`AI: Using cached result for ${funcCall.name}`
						);
						return {
							functionResponse: {
								name: funcCall.name,
								response: this.callHistory[callHash],
							},
						};
					}
					logger.info(
						`Cached ${
							funcCall.name
						} for this gen - ${callHash.slice(0, 7)}...`
					);

					let res = {};
					logger
						.child({ args: funcCall.args })
						.info(`AI: Calling ${funcCall.name}`);
					try {
						res = await ((tools as any)[funcCall.name] as Function)(
							funcCall.args as any,
							ctx
						);
						this.callHistory[callHash] = res; // Store the result
					} catch (e_) {
						logger
							.child({ error: `${e_}` })
							.error(`AI: Error calling ${funcCall.name}`);
						res = {
							"*comment":
								"TELL THE USER ABOUT THIS JAVASCRIPT ERROR WHILE RUNNING TOOL",
							error: `${e_}`,
						};
						this.callHistory[callHash] = res; // Store the error as well
					}

					return {
						functionResponse: {
							name: funcCall.name,
							response: res,
						},
					};
				})
			);

			result = await this.chatSession.sendMessage(functionResults);
		}
		try {
			logger.info(`AI (${loopCount} last iter):`, result.response.text());
		} catch {
			throw `Response blocked by Google: ${JSON.stringify(result.response.promptFeedback)}`
		}

		this.callHistory = {};
		logger.info(
			`AI: ${(result as GenerateContentResult).response.text().trim()}`
		);

		if (
			(result as GenerateContentResult).response.text().trim().length ===
			0
		) {
			// return await this.generateResponse(question)

			this.chatSession = null;

			return ["", toolsUsed];
		}

		return [
			(result as GenerateContentResult).response.text().trim(),
			toolsUsed,
		];
	}
}
