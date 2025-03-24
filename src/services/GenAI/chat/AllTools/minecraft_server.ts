import { FunctionDeclaration } from "@google/generative-ai";
import { Client } from "exaroton";
import { client as DJSClient } from "../../../Bot/bot";
import { addTest, registerTool } from "../tools";

let cached = {};
let cacheReset = Date.now() - 1000;

if (process.env.EXAROTON_TOKEN && process.env.EXAROTON_SERVER) {
	const client = new Client(process.env.EXAROTON_TOKEN);

	const server = client.server(process.env.EXAROTON_SERVER);

	(() => {
		const meta: FunctionDeclaration = {
			name: "mc.status",
			description:
				"Fetches the status of the owner's Minecraft server, including the MOTD and the number of players online."
		};

		async function func(args: any): Promise<any> {
			if (Date.now() < cacheReset) return cached;

			const status = await server.get();
			let s = "unknown";
			if (status.hasStatus(status.STATUS.ONLINE)) s = "online";
			if (status.hasStatus(status.STATUS.STARTING)) s = "starting";
			if (status.hasStatus(status.STATUS.STOPPING)) s = "stopping";
			if (status.hasStatus(status.STATUS.SAVING)) s = "saving_world";
			if (status.hasStatus(status.STATUS.OFFLINE)) s = "offline";
			if (status.hasStatus(status.STATUS.CRASHED)) s = "crashed";

			let c = {
				// name: status.name,
				status: s,
				motd: status.motd,
				software: status.software,
				players: status.players,
				address:
					DJSClient.user!.id === "1271869353389723738"
						? "create.darktru.win"
						: status.address || {
								cantGetAddressError: "ServerNotOnline"
							}
			};

			cached = c;
			cacheReset = Date.now() + 5000;
			return c;
		}

		addTest(meta.name, null);
		registerTool(func, meta);
	})();

	(() => {
		const meta: FunctionDeclaration = {
			name: "exaroton.credits",
			description:
				"Gets the amount of credits in all exaroton credit pools."
		};

		async function func(args: any): Promise<any> {
			const creds = (await client.getPools()).map((a) => {
				return {
					name: a.name,
					isOwner: a.isOwner,
					numServers: a.servers,
					ownShare: a.ownShare,
					ownCredits: a.ownCredits,
					credits: a.credits
				};
			});

			const acct = await client.getAccount();
			return {
				accountCredits: acct.credits,
				creditPools: creds
			};
		}

		addTest(meta.name, null);
		registerTool(func, meta);
	})();
}
