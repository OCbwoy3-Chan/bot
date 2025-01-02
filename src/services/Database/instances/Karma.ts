import { FederatedInstance } from "../FederatedInstance";
import { registerFederatedInstance } from "../federation";

class Karma extends FederatedInstance {
	constructor() {
		super("Karma", "https://karma.ocbwoy3.dev");
	}

	public async banUser(id: string, reason: string): Promise<void> {
		const res = await fetch(`${this.rootUrl}/banplayer`, {
			method: "POST",
			body: JSON.stringify({
				UserId: Number(id),
				Username: `BannedWith112_${id}`,
				Reason: reason,
				Key: process.env.KARMA_KEY!,
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});
		res.text().then(console.log);
	}

	public async unbanUser(id: string): Promise<void> {
		const res = await fetch(`${this.rootUrl}/unbanplayer`, {
			method: "POST",
			body: JSON.stringify({
				UserId: Number(id),
				Key: process.env.KARMA_KEY!,
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});
		res.text().then(console.log);
	}
}

if (process.env.KARMA_KEY) {
	registerFederatedInstance(new Karma());
}
