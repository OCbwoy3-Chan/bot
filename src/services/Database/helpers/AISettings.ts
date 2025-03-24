import { logger } from "../../../lib/Utility";
import { prisma } from "../db";

/**
 * Sets the forced prompt for a channel.
 * @param channelId The Discord Channel ID
 * @param prompt The prompt to set
 */
export async function SetChannelPrompt(
	channelId: string,
	prompt: string
): Promise<void> {
	await prisma.oCbwoy3ChanAI_ChannelSettings.upsert({
		where: { id: channelId },

		update: { forcedPrompt: prompt },
		create: { id: channelId, forcedPrompt: prompt }
	});
	logger.info(
		`[CHANNEL PROMPT SET] Channel ID: ${channelId}, Prompt: ${prompt}`
	);
}

/**
 * Clears the forced prompt for a channel.
 * @param channelId The Discord Channel ID
 */
export async function ClearChannelPrompt(channelId: string): Promise<void> {
	await prisma.oCbwoy3ChanAI_ChannelSettings.delete({
		where: { id: channelId }
	});
	logger.info(`[CHANNEL PROMPT CLEARED] Channel ID: ${channelId}`);
}

/**
 * Sets the forced prompt for a guild.
 * @param guildId The Discord Guild ID
 * @param prompt The prompt to set
 */
export async function SetGuildPrompt(
	guildId: string,
	prompt: string
): Promise<void> {
	await prisma.oCbwoy3ChanAI_GuildSettings.upsert({
		where: { id: guildId },
		update: { forcedPrompt: prompt },
		create: { id: guildId, forcedPrompt: prompt }
	});
	logger.info(`[GUILD PROMPT SET] Guild ID: ${guildId}, Prompt: ${prompt}`);
}

/**
 * Clears the forced prompt for a guild.
 * @param guildId The Discord Guild ID
 */
export async function ClearGuildPrompt(guildId: string): Promise<void> {
	await prisma.oCbwoy3ChanAI_GuildSettings.delete({
		where: { id: guildId }
	});
	logger.info(`[GUILD PROMPT CLEARED] Guild ID: ${guildId}`);
}

/**
 * Gets the forced prompt for a channel.
 * @param channelId The Discord Channel ID
 * @returns The forced prompt or null if not set
 */
export async function GetChannelPrompt(
	channelId: string
): Promise<string | null> {
	const settings = await prisma.oCbwoy3ChanAI_ChannelSettings.findFirst({
		where: { id: channelId }
	});
	return settings ? settings.forcedPrompt : null;
}

/**
 * Gets the forced prompt for a guild.
 * @param guildId The Discord Guild ID
 * @returns The forced prompt or null if not set
 */
export async function GetGuildPrompt(guildId: string): Promise<string | null> {
	const settings = await prisma.oCbwoy3ChanAI_GuildSettings.findFirst({
		where: { id: guildId }
	});
	return settings ? settings.forcedPrompt : null;
}
