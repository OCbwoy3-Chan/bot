import { logger } from "../../../lib/Utility";
import { prisma } from "../db";

/**
 * Adds a user to the whitelist.
 * @param userId The Discord User ID of the user to whitelist
 */

export async function AddAIWhitelist(userId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI.findFirst({
		where: {
			id: userId
		}
	});
	if (existingWhitelist) {
		throw "User is already whitelisted";
	}
	logger.info(`[AI WHITELIST ADD] ${userId}`);
	await prisma.whitelist_OCbwoy3ChanAI.create({
		data: {
			id: userId
		}
	});
}
/**
 * Removes a user from the whitelist.
 * @param userId The Discord User ID of the user to remove from the whitelist
 */

export async function RemoveAIWhitelist(userId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI.findFirst({
		where: {
			id: userId
		}
	});
	if (!existingWhitelist) {
		throw "User is not whitelisted";
	}
	logger.info(`[AI WHITELIST REMOVE] ${userId}`);
	await prisma.whitelist_OCbwoy3ChanAI.delete({
		where: {
			id: userId
		}
	});
}

/**
 * Checks if a user is whitelisted.
 * @param userId The Discord User ID of the user to check
 * @returns True if the user is whitelisted, false otherwise
 */

export async function IsAIWhitelisted(userId: string): Promise<boolean> {
	if (userId === process.env.OWNER_ID!) return true;
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI.findFirst({
		where: {
			id: userId
		}
	});
	return existingWhitelist !== null;
}

/**
 * Adds a channel to the whitelist.
 * @param channelId The Discord User ID of the user to whitelist
 */

export async function AddChannelAIWhitelist(channelId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI_ChannelSpecific.findFirst({
		where: {
			id: channelId
		}
	});
	if (existingWhitelist) {
		throw "Channel is already whitelisted";
	}
	logger.info(`[CHANNEL AI WHITELIST ADD] ${channelId}`);
	await prisma.whitelist_OCbwoy3ChanAI_ChannelSpecific.create({
		data: {
			id: channelId
		}
	});
}
/**
 * Removes a channel from the whitelist.
 * @param channelId The Discord User ID of the user to remove from the whitelist
 */

export async function RemoveChannelAIWhitelist(channelId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI_ChannelSpecific.findFirst({
		where: {
			id: channelId
		}
	});
	if (!existingWhitelist) {
		throw "Channel is not whitelisted";
	}
	logger.info(`[CHANNEL AI WHITELIST REMOVE] ${channelId}`);
	await prisma.whitelist_OCbwoy3ChanAI_ChannelSpecific.delete({
		where: {
			id: channelId
		}
	});
}

/**
 * Checks if a user is whitelisted.
 * @param channelId The Discord User ID of the user to check
 * @returns True if the user is whitelisted, false otherwise
 */

export async function IsChannelAIWhitelisted(channelId: string): Promise<boolean> {
	const existingWhitelist = await prisma.whitelist_OCbwoy3ChanAI_ChannelSpecific.findFirst({
		where: {
			id: channelId
		}
	});
	return existingWhitelist !== null;
}
