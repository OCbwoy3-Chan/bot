import {
	Chat as ChatGemini, FunctionCall,
	GenerateContentConfig,
	GenerateContentResponse,
	HarmBlockThreshold,
	HarmCategory,
	Part
} from "@google/generative-ai";
import crypto from "crypto";
import { readdirSync } from "fs";
import { logger } from "../../../lib/Utility";
import { getGeminiInstance } from "../gemini";
import { getPrompt } from "../prompt/GeneratePrompt";
import { getToolMetas, getTools } from "./tools";
import assert from "assert";
import { getLocaleNow } from "services/Bot/bot";

const files = readdirSync(`${__dirname}/AllTools`, { recursive: true });

files.forEach((a) => {
	if (typeof a === "string" && a.endsWith(".ts")) {
		try {
			import(`${__dirname}/AllTools/${a}`);
		} catch (e_) {
			logger.child({ error: e_ }).error(a);
		}
	}
});

export const tools = getTools();

export const toolMetas = getToolMetas();

export type AIContext = {
	askingUserId: string;
	chatbotUserId: string;
	currentAiModel: string;
	currentChannel: string;
	currentUserStatusOrWhatTheUserIsDoingListeningToEtc: any;
	currentServer: any;
	currentChannelM: any;
	[a: string]: any;
};

export type GenerationConfig = {
	/* 0-2 creativity in response */
	temperature?: number;
	/* idk */
	topP?: 0.95;
	topK?: 40;
};

export class Chat {
	chatSession: ChatGemini | null = null;
	callHistory: { [hash: string]: any } = {}; // Store previous calls
	usersInChat: string[] = [];
	messageQueue: Array<{
		question: string | Array<string | Part>;
		ctx?: AIContext;
		resolve: Function;
		reject: Function;
	}> = [];
	isProcessingQueue: boolean = false;

	constructor(
		public chatModel: string = "gemini-1.5-flash-8b",
		public prompt: string = "ocbwoy3-chan",
		public cfg: GenerationConfig | Partial<GenerateContentConfig> = { temperature: 1, topP: 0.95, topK: 40 }
	) {
		const gemini = getGeminiInstance();

		const generationConfig: Partial<GenerateContentConfig> = {
			temperature: cfg.temperature || 1,
			topP: cfg.topP || 0.95,
			topK: cfg.topK || 40,
			maxOutputTokens: 8192,
			responseMimeType: "text/plain"
		};

		const chatSession = this.chatSession
			? this.chatSession
			: gemini.chats.create({
			model: chatModel,
			config: {
				tools: [
					{
						functionDeclarations: toolMetas
					}
				],
				safetySettings: [
					{
						category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_HARASSMENT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					},
					{
						category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
						threshold: HarmBlockThreshold.BLOCK_NONE
					}
				],
				systemInstruction: getPrompt(prompt),
				...generationConfig
			},
			history: []
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

	private async processQueue() {
		if (this.isProcessingQueue || this.messageQueue.length === 0) return;

		this.isProcessingQueue = true;
		const { question, ctx, resolve, reject } = this.messageQueue.shift()!;

		try {
			const response = await this.generateResponseInternal(question, ctx);
			resolve(response);
		} catch (error) {
			reject(error);
		}

		this.isProcessingQueue = false;
		this.processQueue();
	}

	private async generateResponseInternal(
		question: string | Array<string | Part>,
		ctx?: AIContext
	): Promise<[string, string[]]> {
		if (!this.chatSession) throw "No chat session present";

		logger.info(`User: ${question}`);

		let result: GenerateContentResponse | null = null;
		let loopCount = 0;

		const toolsUsed: string[] = [];

		ctx = ctx || ({} as AIContext);

		ctx.guildLocale = await getLocaleNow({
			channel: ctx?.currentChannelM,
			guild: ctx?.currentServer,
			user: 0 as any
		});

		if (ctx && !this.usersInChat.includes(ctx.askingUserId)) {
			ctx.mustFetchMemories = true;
			this.usersInChat.push(ctx.askingUserId)
			let qRemap: Part[] = [];
			if (typeof question === "string") {
				qRemap = [{ text: question }];
			} else {
				qRemap = question.map((a) =>
					typeof a === "string" ? { text: a } : a
				);
			}

			// SECRET TypeScript hack
			(this.chatSession as any).history.push(
				{
					role: "user",
					parts: [
						{
							text: "CurrentContext: " + JSON.stringify(ctx)
						},
						...qRemap
					]
				},
				{
					role: "model",
					parts: [
						{
							functionCall: {
								name: "memory.get",
								args: {}
							}
						}
					]
				}
			);
			logger.info("[OCbwoy3-Chan AI] Appending an automatic memory.get call");
			toolsUsed.push("memory.get");
			result = await this.chatSession.sendMessage({
				message: [
					{
						functionResponse: {
							name: "memory.get",
							response: await tools["memory.get"]!(null, ctx)
						}
					}
				]
			});
		} else {
			result = await this.chatSession.sendMessage({
				message: [
					{
						text: "CurrentContext: " + JSON.stringify(ctx)
					},
					...question
				]
			});
		}

		// console.log(this.chatSession, ctx, ...question)

		assert(result, "No result :( @ocbwoy3 fix the code");

		let didTheThing = true;
		while (loopCount < 6) {
			try {
				logger.info(`[OCbwoy3-Chan AI] Generation iter #${loopCount}: ${result.text?.trim()}`);
			} catch {
				throw `My response was most likely blocked, it might be Google's fault! Here's the error: ${JSON.stringify(
					result.promptFeedback
				)}`;
			}
			loopCount++;

			// annoying shit because google can't add proper tool support

			if (!result.functionCalls) {
				if (didTheThing === true) break;
				didTheThing = true;
			} else if (result.functionCalls?.length === 0) {
				if (didTheThing === true) break;
				didTheThing = true;
			}

			// but then openai has to be a pain in the ass with forcing everyone to moderate their shit

			const functionCalls =
				result.functionCalls as FunctionCall[];
			if (functionCalls || [].length !== 0) didTheThing = true;
			const functionResults = await Promise.all(
				(functionCalls || []).map(async (funcCall) => {
					if (!toolsUsed.includes(funcCall.name!)) {
						toolsUsed.push(funcCall.name!);
					}
					const callHash = this.generateCallHash(
						funcCall.name!,
						funcCall.args
					);

					if (this.callHistory[callHash]) {
						logger.info(
							`[OCbwoy3-Chan AI] Using cached result for ${funcCall.name}`
						);
						return {
							functionResponse: {
								name: funcCall.name,
								response: this.callHistory[callHash]
							}
						};
					}
					logger.info(
						`[OCbwoy3-Chan AI] Cached ${
							funcCall.name
						} for this generation - ${callHash.slice(0, 7)}...`
					);

					let res = {};
					logger
						.child({ args: funcCall.args })
						.info(`[OCbwoy3-Chan AI] Calling ${funcCall.name}`);
					try {
						res = await ((tools as any)[funcCall.name!] as Function)(
							funcCall.args as any,
							ctx
						);
						if (process.env.NODE_ENV === "development") {
							logger
								.child({
									response: res
								})
								.info(`[OCbwoy3-Chan AI] Tool response for ${funcCall.name}`);
						}
						this.callHistory[callHash] = res; // Store the result
					} catch (e_) {
						logger
							.child({ error: `${e_}` })
							.info(`[OCbwoy3-Chan AI] Error calling ${funcCall.name}`);
						res = {
							"*comment":
								"TELL THE USER ABOUT THIS JAVASCRIPT ERROR WHILE RUNNING TOOL",
							error: `${e_}`
						};
						this.callHistory[callHash] = res; // Store the error as well
					}

					return {
						functionResponse: {
							name: funcCall.name,
							response: res
						}
					};
				})
			);

			result = await this.chatSession.sendMessage({
				message: functionResults
			});
		}
		try {
			if (result.promptFeedback) throw "";
			if (!result.text) throw "";
			result.text!.trim()
			// logger.info(
			// 	`AI (${loopCount} last iter): ${result.response.text().trim()}`
			// );
		} catch {
			throw `Response blocked by Google: ${JSON.stringify(
				result.promptFeedback
			)}`;
		}

		this.callHistory = {};
		//prettier-ignore
		// logger.info(`AI: ${(result as GenerateContentResult).response.text().trim()}`);

		if (
			result.text.trim().length ===
			0
		) {
			this.chatSession = null;
			return ["", toolsUsed];
		}

		// console.log(await this.chatSession?.getHistory())

		return [
			result.text.trim(),
			toolsUsed
		];
	}

	public async generateResponse(
		question: string | Array<string | Part>,
		ctx?: AIContext
	): Promise<[string, string[]]> {
		return new Promise((resolve, reject) => {
			this.messageQueue.push({ question, ctx, resolve, reject });
			this.processQueue();
		});
	}
}
