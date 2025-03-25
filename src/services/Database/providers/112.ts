import { prisma } from "@db/db";
import {
	GbanProvider,
	registerGbanProvider,
	TransformedGban,
	TransformedGbanSchema
} from "@db/GBanProvider";
import { client } from "services/Bot/bot";

let cachedModeratorDisplayNames: {
	[id: string]: string;
} = {};

export async function fetchModNickname(id: string): Promise<string> {
	if (cachedModeratorDisplayNames[id]) {
		return cachedModeratorDisplayNames[id];
	}

	try {
		const user = await client.users.fetch(id);
		cachedModeratorDisplayNames[id] = user.displayName;
		return user.displayName;
	} catch {
		cachedModeratorDisplayNames[id] = `${id}`;
		return `${id}`;
	}
}

class Local extends GbanProvider {
	public async getBans(): Promise<TransformedGbanSchema> {
		const data = await prisma.robloxUserBan.findMany();
		let transformedBans: TransformedGbanSchema = {};
		data.forEach(async (b) => {
			const x = (Number(b.bannedUntil) || -1)*1000
			transformedBans[b.userId] = {
				reason: b.reason,
				moderator:
					b.moderatorName || (await fetchModNickname(b.moderatorId)),
				verified: true,
				isLocal: !!b.noFederate,
				otherMetadata: {
					bannedUntil: b.bannedUntil === "-1" ? "forever" : new Date(x).toISOString()
				}
			};
		});
		return transformedBans;
	}

	public async getBan(id: string): Promise<TransformedGban | null> {
		const bans = await this.getBans();
		return bans[id];
	}
}

registerGbanProvider(new Local("112"));
