import {
	fetchWithTimeout,
	GbanProvider,
	registerGbanProvider,
	TransformedGban,
	TransformedGbanSchema
} from "@db/GBanProvider";

interface KarmaBan {
	plr: string;
	reason: string;
	nova?: boolean;
	oneonetwo?: boolean;
}

class Karma extends GbanProvider {
	public async getBans(): Promise<TransformedGbanSchema> {
		const data = await fetchWithTimeout("https://karma.ocbwoy3.dev/bans", {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"SEC-CH-UA-PLATFORM": "Linux",
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
			}
		});
		const bans: { [id: string]: KarmaBan } = await data.json();
		const transformedBans: TransformedGbanSchema = {};
		Object.entries(bans).forEach(([v, d]) => {
			transformedBans[v.toString()] = {
				reason: d.reason,
				propogatedFromGbanProvider:
					d.nova || d.oneonetwo
						? d.nova
							? "112"
							: d.oneonetwo
								? "112"
								: undefined
						: undefined
			};
		});
		return transformedBans;
	}

	public async getBan(id: string): Promise<TransformedGban | null> {
		const bans = await this.getBans();
		return bans[id];
	}
}

registerGbanProvider(new Karma("Karma"));
