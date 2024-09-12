import { PrismaClient, RobloxUserBan } from "@prisma/client";
import { BanParams } from "../../lib/Types";
import { RefreshAllBanlands } from "../../lib/BanlandCacheHelper";
import { logger } from "../../lib/Utility";

export const prisma = new PrismaClient();

/**
 * Gets all banned users
 * @returns All banned users
 */
export async function GetAllBans(): Promise<RobloxUserBan[]> {
	return await prisma.robloxUserBan.findMany();
}

/**
 * Checks if a user is banned.
 * @param userId The Roblox User ID of the user to check
 * @returns The ban entry if they are banned, null otherwise
 */
export async function GetBanData(userId:string): Promise<RobloxUserBan|null> {
	return await prisma.robloxUserBan.findFirst({
		where: {
			userId: userId
		}
	});
}

/**
 * Bans a user.
 * @param params The ban parameters
 */
export async function BanUser(params: BanParams): Promise<void> {
	if (await GetBanData(params.UserID)) {
		throw "User is already banned";
		return;
	}
	logger.info(`[NEW BAN] ${params.UserID} by ${params.ModeratorName}, ${(new Date(parseInt(params.BannedUntil)*1000).toISOString())} (${params.Nature}, ${params.Reason})`)
	await prisma.robloxUserBan.create({
		data: {
			userId: params.UserID,
			reason: params.Reason,
			bannedUntil: params.BannedUntil,
			privateReason: params.PrivateReason,
			moderatorId: params.ModeratorId,
			moderatorName: params.ModeratorName,
			bannedFrom: params.BannedFrom,
			nature: params.Nature
		}
	});
	await RefreshAllBanlands();
}

/**
 * Unnans a user.
 * @param userid The banned player's Roblox User ID
 */
export async function UnbanUser(userid: string): Promise<void> {
	if (!(await GetBanData(userid))) {
		throw "User is not banned";
		return;
	}
	logger.info(`[UNBAN] ${userid}`)
	await prisma.robloxUserBan.delete({
		where: {
			userId: userid
		}
	});
	await RefreshAllBanlands();
}
