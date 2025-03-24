import { fetchWithTimeout, logger } from "@112/Utility";
import { FederatedInstance } from "../FederatedInstance";
import { registerFederatedInstance } from "../federation";
import { GetUserDetails } from "@112/roblox";

class Karma extends FederatedInstance {
	constructor() {
		super("Karma", "https://karma.ocbwoy3.dev");
	}

	public async getBanReason(id: string): Promise<string | null> {
		try {
			const bans = await fetchWithTimeout(`${this.rootUrl}/bans`);
			const banData = await bans.json();
			return banData[id] ? banData[id].reason : null;
		} catch {
			return null;
		}
	}

	public async banUser(id: string, reason: string): Promise<void> {
		if ((await this.getBanReason(id)) === `(112) ${reason}`) return;
		const ud = await (async () => {
			try {
				return (await GetUserDetails(id)).username;
			} catch {
				return `roblox_user_${id}`;
			}
		})();
		const res = await fetchWithTimeout(`${this.rootUrl}/banplayer`, {
			method: "POST",
			body: JSON.stringify({
				UserId: Number(id),
				Username: (await GetUserDetails(id)).username,
				Reason: reason,
				Key: process.env.KARMA_KEY!
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});
		res.text().then(console.log);
		logger.info(
			`[FEDERATION] Banned ${id} from ${this.name} for reason: ${reason}`
		);
	}

	public async unbanUser(id: string): Promise<void> {
		const res = await fetchWithTimeout(`${this.rootUrl}/unbanplayer`, {
			method: "POST",
			body: JSON.stringify({
				UserId: Number(id),
				Key: process.env.KARMA_KEY!
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});
		res.text().then(console.log);
		logger.info(`[FEDERATION] Unbanned ${id} from ${this.name}`);
	}
}

if (process.env.KARMA_KEY) {
	registerFederatedInstance(new Karma());
}
