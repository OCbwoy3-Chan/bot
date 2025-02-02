import { RobloxUserBan } from "@prisma/client";
import { RefreshAllBanlands } from "../../../lib/BanlandCacheHelper";
import { AllBanlandScopes } from "../../../lib/Constants";
import { BanParams, UpdateBanParams } from "../../../lib/Types";
import { logger } from "../../../lib/Utility";
import { prisma } from "../db";
import { banUserAcrossFederations, unbanUserAcrossFederations } from "../federation";
import { IsRobloxWhitelisted } from "./RobloxWhitelist";

function IsValidBanningScope(scope: string): boolean {
	let retval = false;
	AllBanlandScopes.forEach((s) => {
		if (scope === s) {
			retval = true;
		}
	});
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
	} catch (e_) {
		logger.child({ error: e_ }).error("An error has occoured");
		return [];
	}
}
/**
 * Checks if a user is banned.
 * @param userId The Roblox User ID of the user to check
 * @returns The ban entry if they are banned, null otherwise
 */

export async function GetBanData(
	userId: string
): Promise<RobloxUserBan | null> {
	return await prisma.robloxUserBan.findFirst({
		where: {
			userId: userId,
		},
	});
}
/**
 * Bans a user.
 * @param params The ban parameters
 */

export async function BanUser(params: BanParams): Promise<void> {
	if (await GetBanData(params.UserID)) {
		throw "User is already banned";
	}
	if (!IsValidBanningScope(params.BannedFrom))
		throw `Invalid banning scope \`${params.BannedFrom}\``;
	const user = await IsRobloxWhitelisted(params.UserID);
	if (user) {
		throw `<@${user}> is whitelisted and cannot be banned.`
	}
	logger.info(
		`[NEW BAN] ${params.hackBan ? "HACKBAN " :""}${params.UserID} by ${params.ModeratorName}, ${new Date(
			parseInt(params.BannedUntil) * 1000
		).toISOString()} (${params.Reason})`
	);
	banUserAcrossFederations(
		params.UserID,
		params.Reason || "Unspecified reason"
	).catch(() => { });
	await prisma.robloxUserBan.create({
		data: {
			userId: params.UserID,
			reason: params.Reason,
			bannedUntil: params.BannedUntil,
			privateReason: params.PrivateReason,
			moderatorId: params.ModeratorId,
			moderatorName: params.ModeratorName,
			bannedFrom: params.BannedFrom,
			hackBan: params.hackBan
		},
	});
	await RefreshAllBanlands();
}
/**
 * Update's a users ban.
 * @param params The ban parameters
 */

export async function UpdateUserBan(params: UpdateBanParams): Promise<void> {
	if (!(await GetBanData(params.UserID))) {
		throw "User not banned";
	}
	if (!IsValidBanningScope(params.BannedFrom))
		throw `Invalid banning scope \`${params.BannedFrom}\``;
	logger.info(
		`[UPDATE BAN] ${params.hackBan ? "HACKBAN " :""}${params.UserID} by ${params.ModeratorName}, ${new Date(
			parseInt(params.BannedUntil) * 1000
		).toISOString()} (${params.Reason})`
	);
	await new Promise((resolve) => setTimeout(resolve, 3000)); // hardcoded
	banUserAcrossFederations(
		params.UserID,
		params.Reason || "Unspecified reason"
	).catch(() => { });
	await prisma.robloxUserBan.update({
		where: {
			userId: params.UserID,
		},
		data: {
			userId: params.UserID,
			reason: params.Reason,
			bannedUntil: params.BannedUntil,
			privateReason: params.PrivateReason,
			moderatorId: params.ModeratorId,
			moderatorName: params.ModeratorName,
			bannedFrom: params.BannedFrom,
			hackBan: params.hackBan
		},
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
	}
	logger.info(`[UNBAN] ${userid}`);
	await new Promise((resolve) => setTimeout(resolve, 3000)); // hardcoded
	unbanUserAcrossFederations(userid).catch(() => { });
	await prisma.robloxUserBan.delete({
		where: {
			userId: userid,
		},
	});
	await RefreshAllBanlands();
}
