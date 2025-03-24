import { logger } from "../../../lib/Utility";
import { prisma } from "../db";

export async function IsRobloxWhitelisted(
	userId: string
): Promise<string | null> {
	const existingWhitelist = await prisma.whitelist_RobloxUser.findFirst({
		where: {
			robloxId: userId
		}
	});
	return existingWhitelist ? existingWhitelist.discordId : null;
}

export async function addRobloxWhitelist(
	robloxId: string,
	discordId: string
): Promise<void> {
	const existingWhitelist = await prisma.whitelist_RobloxUser.findFirst({
		where: {
			robloxId: robloxId
		}
	});
	if (existingWhitelist) {
		throw "User is already whitelisted";
	}
	logger.info(
		`[WHITELIST ADD] Roblox ID: ${robloxId}, Discord ID: ${discordId}`
	);
	await prisma.whitelist_RobloxUser.create({
		data: {
			robloxId: robloxId,
			discordId: discordId
		}
	});
}

export async function removeRobloxWhitelist(robloxId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist_RobloxUser.findFirst({
		where: {
			robloxId: robloxId
		}
	});
	if (!existingWhitelist) {
		throw "User is not whitelisted";
	}
	logger.info(`[WHITELIST REMOVE] Roblox ID: ${robloxId}`);
	await prisma.whitelist_RobloxUser.delete({
		where: {
			robloxId: robloxId
		}
	});
}
