import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	Attachment,
	InteractionContextType,
} from "discord.js";
import { general } from "../../../locale/commands";
import {
	areGenAIFeaturesEnabled,
	getFileManagerInstance,
	getGeminiInstance,
	getSystemInstructionText,
} from "../../GenAI/gemini";
import {
	ChatSession,
	DynamicRetrievalMode,
	HarmBlockThreshold,
	HarmCategory,
	SchemaType,
	Tool,
} from "@google/generative-ai";
import { logger } from "../../../lib/Utility";
import { RegularResults, search } from "@navetacandra/ddg";

let chat: ChatSession | null = null;

class SlashCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Generative AI Tools",
			preconditions: (<unknown>[
				"BanAccess",
			]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "reset",
					chatInputRun: "chatInputClear",
				},
				{
					name: "ask",
					chatInputRun: "chatInputGenerateInfoman",
				},
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall
				)
				.addSubcommand((builder) =>
					builder
						.setName("reset")
						.setDescription("Resets the chat history")
				)
				.addSubcommand((builder) =>
					builder
						.setName("ask")
						.setDescription(
							"Ask InfoMan a question. (Powered by Gemini)"
						)
						.addStringOption((option) =>
							option
								.setName("question")
								.setDescription("The question you want to ask.")
								.setRequired(true)
						)
						.addBooleanOption((option) =>
							option
								.setName("google")
								.setDescription(
									"Use Google to retrieve information instead of DuckDuckGo (Might get ratelimited)."
								)
								.setRequired(false)
						)
				)
		);
	}

	public async chatInputClear(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		chat = null;
		await interaction.reply("Chat history has been cleared.");
	}

	public async chatInputGenerateInfoman(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		// check if user is bot owner
		if (interaction.user.id !== process.env.OWNER_ID) {
			return await interaction.reply(
				general.errors.missingPermission("GENERATIVE_AI")
			);
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		// check for question lenght, reject if over 256
		if (
			(interaction.options.get("question")!.value as string).length > 256
		) {
			return await interaction.reply("Question is too long.");
		}

		const useGoogle: boolean = (
			(interaction.options.get("google") as any) || { value: false }
		).value;

		await interaction.deferReply({ ephemeral: false, fetchReply: true });

		const googleTool: Tool = {
			googleSearchRetrieval: {
				dynamicRetrievalConfig: {
					mode: DynamicRetrievalMode.MODE_DYNAMIC,
					dynamicThreshold: 0.3,
				},
			},
		};

		const duckduckgoTool: Tool = {
			functionDeclarations: [
				{
					name: "duckduckgoSearch",
					parameters: {
						type: SchemaType.OBJECT,
						description:
							"Searches DuckDuckGo for information on the given query.",
						properties: {
							query: {
								type: SchemaType.STRING,
								description:
									"The query to search DuckDuckGo for information on.",
							},
						},
						required: ["query"],
					},
				},
			],
		};

		try {
			const gemini = getGeminiInstance();

			const model = gemini.getGenerativeModel({
				model: "gemini-1.5-flash-8b",
				tools: useGoogle ? [googleTool] : [duckduckgoTool],
			});

			const generationConfig = {
				temperature: 1.5,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 8192,
				responseMimeType: "text/plain",
			};

			const chatSession = chat
				? chat
				: model.startChat({
						generationConfig,
						history: [],
				  });

			chat = chatSession;

			logger.info(
				`${interaction.user.displayName}: ${
					interaction.options.get("question")!.value as string
				}`
			);

			let result = await chatSession.sendMessage(
				`${interaction.options.get("question")!.value as string}`
			);

			const call = result.response.functionCalls()?.[0];
			if (call) {
				logger
					.child({ args: call.args })
					.info(`[TOOL CALL] ${model.model}: ${call.name}`);
				if (call.name === "duckduckgoSearch") {
					const searchResults = await search({
						query: (call.args as any).query as string,
					});
					let results = (searchResults.results as RegularResults).map(
						(result) => {
							return {
								title: result.title,
								description: result.description,
								url: result.url,
							};
						}
					);
					result = await chatSession.sendMessage([
						{
							functionResponse: {
								name: "duckduckgoSearch",
								response: {
									currentUnixMillis: Date.now(),
									currentTimeISO_UTC0:
										new Date().toISOString(),
									results,
								},
							},
						},
					]);
				}
			}

			let response = result.response;
			let text = response.text();

			logger.info(`${model.model}: ${text}`);

			if (text.length > 2000) {
				return await interaction.followUp({
					content: "Result is too long, message sent in attachment.",
					files: [
						{
							name: "Message.txt",
							attachment: text,
						},
					],
				});
			} else {
				return await interaction.followUp({
					content: text,
				});
			}
		} catch (e_) {
			chat = null;
			logger.child({ error: e_ }).error("Error in genai command");
			console.error(e_);
			if (`${e_}`.includes("check quota")) {
				return await interaction.followUp({
					content:
						general.errors.genai.ratelimit() +
						"\n> Maybe use this command without the `google` argument?",
				});
			}
			return await interaction.followUp({
				content: `${e_}`,
			});
		}
	}
}

export default SlashCommand;
