import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { GetChannelPrompt, GetGuildPrompt } from "../../Database/helpers/AISettings";
import { AIContext, Chat } from "@ocbwoy3chanai/chat/index";

import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    AttachmentBuilder,
    GuildChannel,
    InteractionContextType,
    TextChannel
} from "discord.js";
import { Part } from "@google/generative-ai";
import { getDistroNameSync } from "@112/Utility";
import { GetAIModel } from "../listeners/OCbwoy3ChanAI";

class AskCommand extends Command {
    public constructor(
        context: Subcommand.LoaderContext,
        options: Subcommand.Options
    ) {
        super(context, {
            ...options,
            description: "Asks OCbwoy3-Chan a question",
            preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
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
                .setName("ask")
                .setDescription("Ask OCbwoy3-Chan a question")
                .addStringOption((option) =>
                    option
                        .setName("message")
                        .setDescription("The message to ask")
                        .setRequired(true)
                )
                .addAttachmentOption((option) =>
                    option
                        .setName("vision")
                        .setDescription("Include vision analysis")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(
        interaction: Command.ChatInputCommandInteraction
    ) {
        if (!(await IsAIWhitelisted(interaction.user.id))) {
            return await interaction.reply({
                content: general.errors.missingPermission("GENERATIVE_AI"),
                ephemeral: true,
            });
        }
        if (!areGenAIFeaturesEnabled()) {
            return await interaction.reply(general.errors.genai.aiDisabled());
        }

        await interaction.deferReply({
            ephemeral: false,
            fetchReply: true
        });

        const message = interaction.options.getString("message", true);
        const vision = interaction.options.getAttachment("vision", false) ? true : false;

        let prompt = "default";
        const channelPrompt = await GetChannelPrompt(interaction.channelId);
        if (channelPrompt) {
            prompt = channelPrompt;
        } else if (interaction.guildId) {
            const guildPrompt = await GetGuildPrompt(interaction.guildId);
            if (guildPrompt) {
                prompt = guildPrompt;
            }
        }

        const chat = chatManager.getChat(interaction.channelId, GetAIModel(), prompt);

        const parts: Array<string | Part> = [message];
        if (vision) {
            for (const attachment of [interaction.options.getAttachment("vision", true)]) {
                try {
                    const response = await fetch(attachment.url);
                    const raw = await response.arrayBuffer();
                    const mimeType = response.headers.get("content-type") || "text/plain";
                    parts.push({
                        inlineData: {
                            data: Buffer.from(raw).toString("base64"),
                            mimeType: mimeType,
                        },
                    });
                } catch (e_) {
                    console.warn(`Failed to download attachment: ${e_}`);
                }
            }
        }

        const params: AIContext = {
            askingUserId: interaction.user.id,
            chatbotUserId: interaction.client.user!.id,
            currentAiModel: chat.chatModel,
            currentChannel: interaction.channelId,
            currentUserStatusOrWhatTheUserIsDoingListeningToEtc: { error: "not usable with /ask command" },
            currentServer: interaction.guild
                ? {
                    name: interaction.guild.name,
                    id: interaction.guild.id,
                }
                : null,
            currentChannelM: {
                name: interaction.channel ? ((interaction.channel as GuildChannel).name || null) : null,
            },
            currentDistro: getDistroNameSync(),
            currentWorkingDir: process.cwd(),
        };

        let response = "";
        let toolsUsed: string[] = [];
        let err: any = false;
        try {
            [response, toolsUsed] = await chat.generateResponse(parts, params);
            if (response.length === 0) throw "Got empty message";
            if (response.trim().replace(/ +/g, " ").length > 2000) {
                return await interaction.followUp({
                    content: "> Message too long, sending as file.",
                    files: [
                        new AttachmentBuilder(Buffer.from(response), {
                            name: "message.txt",
                        }),
                    ],
                    ephemeral: true,
                });
            }
        } catch (e_) {
            err = e_;
            chatManager.clearChat(interaction.channelId);
        }

        if (err !== false) {
            return await interaction.followUp({
                content: `> ${err}`,
                ephemeral: true,
            });
        }

        return await interaction.followUp({
            content: response,
            ephemeral: false,
        });
    }
}

export default AskCommand;
