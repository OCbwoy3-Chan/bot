import { PrismaClient, RobloxUserBan } from "@prisma/client";
import { BanParams } from "../../lib/Types";
import { RefreshAllBanlands } from "../../lib/BanlandCacheHelper";
import { logger } from "../../lib/Utility";
import { AllBanlandScopes, AllRoles } from "../../lib/Constants";

export const prisma = new PrismaClient();

function IsValidBanningScope(scope: string): boolean {
	let retval = false;
	AllBanlandScopes.forEach(s=>{
		if (scope === s) {
			retval = true;
		}
	})
	return retval;
}

/**
 * Gets all banned users
 * @returns All banned users
 */
export async function GetAllBans(): Promise<RobloxUserBan[]> {
	try {
		const b = await prisma.robloxUserBan.findMany();
		return b;
	} catch(e_) {
		logger.child({error: e_}).error("An error has occoured");
		return [];
	}
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
	if (!IsValidBanningScope(params.BannedFrom)) throw `Invalid banning scope \`${params.BannedFrom}\``;
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
