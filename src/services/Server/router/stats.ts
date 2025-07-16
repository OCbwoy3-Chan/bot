import staticPlugin from "@elysiajs/static";
import { Activity, Presence } from "discord.js";
import Elysia, { t } from "elysia";
import { join } from "path";

export const router = new Elysia().use(
	staticPlugin({
		assets: join(__dirname, "..", "..", "..", "..", "media"),
		prefix: "/assets"
	})
);

let presence: Presence | null = {
	userId: "486147449703104523",
	guild: "1262483043654832259" as any,
	status: "dnd",
	activities: [
		{
			name: "OCbwoy3-Chan Music",
			type: 2,
			url: null,
			details: "BROKEN STATUS",
			state: "@ocbwoy3 fix!!!",
			applicationId: "886578863147192350",
			timestamps: {},
			party: null,
			syncId: null,
			assets: {},
			flags: 0,
			emoji: null,
			buttons: ["TEST"],
			createdTimestamp: 1741353638376
		}
	] as any as Activity[],
	clientStatus: {
		embedded: "dnd"
	} as any
} as any;

export function setPresence(p: any | null) {
	presence = p;
}

export function getPresence(): Presence | null {
	return presence;
}

let numBans: number = 0;

export function setNumBans(p: number) {
	numBans = p;
}

router.get(
	"/stats.json",
	() => ({
		numBans
	}),
	{
		response: t.Object({
			numBans: t.Number()
		})
	}
);

router.get("/ocbwoy3dev/rpc.json", () => presence, {
	response: t.Any()
});
