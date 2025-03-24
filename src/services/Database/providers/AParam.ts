import {
	fetchWithTimeout,
	GbanProvider,
	registerGbanProvider,
	TransformedGban,
	TransformedGbanSchema
} from "@db/GBanProvider";

type AParamBan = string

class AParam extends GbanProvider {
	public async getBans(): Promise<TransformedGbanSchema> {
		const data = await fetchWithTimeout("https://zv7i.dev/static/aparambans.json", {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"SEC-CH-UA-PLATFORM": "Linux",
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
			}
		});
		const bans: { [id: string]: AParamBan } = await data.json();
		let transformedBans: TransformedGbanSchema = {};
		Object.entries(bans).forEach(([v, d]) => {
			transformedBans[v.toString()] = {
				reason: d,
			};
		});
		return transformedBans;
	}

	public async getBan(id: string): Promise<TransformedGban | null> {
		const bans = await this.getBans();
		return bans[id];
	}
}

registerGbanProvider(new AParam("AParam"));
