import {
	fetchWithTimeout,
	GbanProvider,
	registerGbanProvider,
	TransformedGban,
	TransformedGbanSchema
} from "@db/GBanProvider";

interface The112x4Ban {
	reason: string;
	moderator: string;
	robloxUsername: string;
}

class The112x4 extends GbanProvider {
	public async getBans(): Promise<TransformedGbanSchema> {
		const data = await fetchWithTimeout("https://father-skidgod.onrender.com/bans", {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"SEC-CH-UA-PLATFORM": "Linux",
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
			}
		});
		const bans: { [id: string]: The112x4Ban } = await data.json();
		let transformedBans: TransformedGbanSchema = {};
		Object.entries(bans).forEach(([v, d]) => {
			transformedBans[v.toString()] = {
				reason: d.reason,
				moderator: d.moderator
			};
		});
		return transformedBans;
	}

	public async getBan(id: string): Promise<TransformedGban | null> {
		const bans = await this.getBans();
		return bans[id];
	}
}

registerGbanProvider(new The112x4("112x4"));
