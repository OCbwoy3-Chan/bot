import {
	fetchWithTimeout,
	GbanProvider,
	registerGbanProvider,
	TransformedGban,
	TransformedGbanSchema
} from "@db/GBanProvider";
import { client } from "services/Bot/bot";

interface NovaBan {
	username: string; // dont use
	reason: string;
	verified: boolean;
	bannedBy: string; // discord userid
}

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

class Nova extends GbanProvider {
	public async getBans(): Promise<TransformedGbanSchema> {
		const data = await fetchWithTimeout("https://nova.ocbwoy3.dev/api/bans", {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"SEC-CH-UA-PLATFORM": "Linux",
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
			}
		});
		const bans: { [id: string]: NovaBan } = await data.json();
		let transformedBans: TransformedGbanSchema = {};
		Object.entries(bans).forEach(async ([v, d]) => {
			transformedBans[v.toString()] = {
				reason: d.reason,
				moderator: await fetchModNickname(d.bannedBy),
				verified: d.verified
			};
		});
		return transformedBans;
	}

	public async getBan(id: string): Promise<TransformedGban | null> {
		const bans = await this.getBans();
		return bans[id];
	}
}

registerGbanProvider(new Nova("Nova"));
