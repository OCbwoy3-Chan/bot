import { PrismaClient, RobloxUserBan, User } from "@prisma/client";
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

/**
 * Returns a bool if the user is allowed for something or not.
 * @param userId The user's User ID
 * @param permission The permission's ID
 * @returns If the user is allowed for the permission
 */
export async function IsAllowed(userId: string, permission: string): Promise<boolean> {
	if (userId === process.env.OWNER_ID) {
		return true;
	}

	const u: User | null = await prisma.user.findFirst({
		where: {
			discordId: { equals: userId }
		}
	});

	if (!u) return false;

	const role = AllRoles[u.role.toString()];
	if (!role) return false;

	if (role.permissions.includes(permission)) return true;

	return false;
}


export async function SetPermissionLevel(userId: string, permissionLevel: number): Promise<void> {

	if (permissionLevel === 0) {
		try {
			await prisma.user.delete({
				where: {
					discordId: userId
				}
			});
		} catch {}
		return;
	}

	try {
		await prisma.user.update({
			where: {
				discordId: userId
			},
			data: {
				role: permissionLevel
			}
		});
	} catch {
		await prisma.user.create({
			data: {
				discordId: userId,
				role: permissionLevel
			}
		});

	}

}

