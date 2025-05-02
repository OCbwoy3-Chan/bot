import { prisma } from "@db/db";
import { UnbanUser } from "./RobloxBan";
import { logger } from "@112/Utility";

export async function runAutoUnban() {
	try {
		const timeRn = Math.ceil(Date.now() / 1000);
		const bannedSkids = await prisma.robloxUserBan.findMany({
			where: {
				bannedUntil: { not: "-1" }
			}
		});
		for (const skid of bannedSkids) {
			try {
				const timeSkidUnbanned = Number(skid.bannedUntil);
				if (timeRn >= timeSkidUnbanned) {
					logger.child({ skid }).info(`Automatically unbanning skid ID ${skid.userId} because their ban expired.`)
					await UnbanUser(skid.userId);
				}
			} catch (error) {
				logger.error(`Failed to unban skid ID ${skid.userId}:`, error);
			}
		}
	} catch {}
}
