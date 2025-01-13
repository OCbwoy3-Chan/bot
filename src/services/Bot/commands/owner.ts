import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { prisma } from "../../Database/db";
import { general } from "../../../locale/commands";
import { AllModels, areGenAIFeaturesEnabled } from "../../GenAI/gemini";

class SlashCommand extends Subcommand {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Commands to manage 112.",
			preconditions: (<unknown>[
				"OwnerOnly",
			]) as PreconditionEntryResolvable[],
			subcommands: [
				{
					name: "listwl",
					chatInputRun: "chatInputListWhitelist",
				},
				{
					name: "listwl_ai",
					chatInputRun: "chatInputListAIWhitelist",
				},
				{
					name: "set_model",
					chatInputRun: "chatInputSelectModel",
				},
				{
					name: "kill",
					chatInputRun: "chatInputKill",
				},
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
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
					.addSubcommand((command) =>
						command
							.setName("listwl")
							.setDescription("Lists the current whitelist")
					)
					.addSubcommand((command) =>
						command
							.setName("listwl_ai")
							.setDescription("Lists the current genai whitelist")
					)
					.addSubcommand((command) =>
						command
							.setName("kill")
							.setDescription("Kills the current process")
					)
					.addSubcommand((command) =>
						command
							.setName("set_model")
							.setDescription("Sets OCbwoy3-Chan's AI Model")
					)
			// .addStringOption(x=>x.setName("user").setDescription("The Username of the user to ban").setRequired(true))
		);
	}

	public async chatInputListWhitelist(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist.findMany();

		return interaction.reply({
			content: `> **${wl.length} users whitelisted**${wl.map(
				(a) => `\n> <@${a.id}>`
			)}`,
			ephemeral: true,
		});
	}

	public async chatInputListAIWhitelist(
		interaction: Command.ChatInputCommandInteraction
	) {
		const wl = await prisma.whitelist_OCbwoy3ChanAI.findMany();

		return interaction.reply({
			content: `> **${wl.length} users genai whitelisted**${wl.map(
				(a) => `\n> <@${a.id}>`
			)}`,
			ephemeral: true,
		});
	}

	public async chatInputSelectModel(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId("ocbwoy3chanai_select_model")
			.setPlaceholder("Make a selection!")
			.addOptions(
				Object.entries(AllModels).map((a) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(a[0])
						.setDescription(a[1].m + " - " + a[1].t)
						.setValue(a[1].m);
				})
			);

		const row = new ActionRowBuilder().addComponents(select);

		await interaction.reply({
			content: "Choose a model!",
			components: [row as any],
		});
	}

	public async chatInputKill(
		interaction: Command.ChatInputCommandInteraction
	) {
		await interaction.reply({
			content: `> Killing Process (Will restart if using PM2/Docker)\n> PID: ${process.pid}, Parent PID: ${process.ppid}`,
			ephemeral: true,
		});
		process.kill(process.pid, "SIGTERM");
		// love this, absolutely amazing
	}
}

export default SlashCommand;
