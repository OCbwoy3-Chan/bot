import { PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { general } from "../../../locale/commands";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { Chat } from "../../GenAI/chat";
import { response } from "express";

let chat: Chat | null = null;

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
			return await interaction.reply("> Question is too long.");
		}

		await interaction.deferReply({ ephemeral: false, fetchReply: true });

		const chatSession = chat ? chat : new Chat();
		chat = chatSession;

		const chatV = chat;

		let response = "";
		let toolsUsed: string[] = [];
		let err: any = false;
		try {
			[response, toolsUsed] = await chatSession.generateResponse(
				interaction.options.get("question")!.value as string
			);
		} catch (e_) {
			err = e_;
		}

		try {
			if (err !== false) throw err;

			await interaction.followUp({
				content: response.trim().replace(/ +/g," "),
				embeds: [
					{
						title: chatV.chatModel,
						description: (toolsUsed.length === 0 ? "No tools used" : toolsUsed.map(a=>`\`${a}\``).join(", ") )
					}
				]
			});
		} catch (e_) {
			chat = null;
			console.error(e_);
			if (`${e_}`.includes("Message was blocked by AutoMod")) {
				try {
					const r = await interaction.user.send({
						content:
							"I apologize, but my message was blocked by AutoMod. Here's the answer to your question:",
					});
					await r.reply({
						content: response.trim().replace(/ +/g," "),
						embeds: [
							{
								title: chatV.chatModel,
								description: (toolsUsed.length === 0 ? "No tools used" : toolsUsed.map(a=>`\`${a}\``).join(", ") )
							}
						]
					});
				} catch {}
				try {
					return await interaction.followUp({
						content: `I apologize, but my message was blocked by AutoMod, therefore I am unable to answer to your question.`,
						embeds: [
							{
								description: "**Message blocked by AutoMod**`"
							}
						]
					});
				} catch {}
			}
			return await interaction.followUp({
				content: `> ${e_}`,
			});
		}
	}
}

export default SlashCommand;
