import { Elysia, error, t } from "elysia";
import {
	AddToBanlandCacheManager,
	BanlandCacheHelper
} from "../../lib/BanlandCacheHelper";
import { router as statsRouter, setNumBans } from "./router/stats";
import { aiRouter } from "./router/chat";
import { execSync } from "child_process";
import { getDistroNameSync } from "@112/Utility";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { prisma } from "@db/db";

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const version = execSync("git describe --tags").toString().trim();
const commit = execSync("git rev-parse HEAD").toString().trim();

const distro = getDistroNameSync();

export const app = new Elysia().use(cors()).use(
	swagger({
		path: "/docs",
		documentation: {
			info: {
				title: "OCbwoy3-Chan AI Gban API",
				description: `The OCbwoy3-Chan AI GBan Infernece API\n![](https://lionsmane.us-east.host.bsky.network/xrpc/com.atproto.sync.getBlob?did=did:plc:s7cesz7cr6ybltaryy4meb6y&cid=bafkreiftmixjo7zscth33n35jppuhzojczkwshfmtczoxprfsj43cld4bu)`,
				version: `${version} (${branch})`
			}
		}
	})
);

app.get(
	"/",
	`ocbwoy3.dev - [112 / OCbwoy3-Chan] ${branch}@${commit} (${version}) running on ${distro}`
);

app.use(statsRouter);

const AllBanlandCacheHelper = new BanlandCacheHelper("All");
AllBanlandCacheHelper._updateBanCountFunc = setNumBans;

AddToBanlandCacheManager(AllBanlandCacheHelper);

function banlandRoute(r: string) {
	app.get(r, () => AllBanlandCacheHelper.getBans(), {
		tags: ["gbans"],
		response: {
			200: t.Record(
				t.String({
					pattern: "^([0-9]*)$",
					default: "5366745988",
					description: "User ID"
				}), // User ID as a string
				t.Object(
					{
						Reason: t.String({
							default: "Testing account for Nova",
							description: "Ban reason"
						}),
						Moderator: t.String({
							default: "UsernameHere",
							description: "Moderator name"
						}),
						Expiry: t.String({
							default: "-1",
							description:
								"Ban expiry in UNIX seconds (-1 is never)",
							pattern: "^(\\-?[0-9]+)$"
						})
					},
					{
						default: {
							Reason: "Testing account for Nova",
							Moderator: "UsernameHere",
							Expiry: "-1"
						}
					}
				),
				{
					title: "Globally banned users",
					minProperties: 0
				}
			)
		}
	});
}

banlandRoute("/.prikolshub/banland.json");
banlandRoute("/banland.json");
banlandRoute("/bans");

let gbanSyncKeys: {[a: string]: string} = {};

setInterval(async() => {
	try {
		const keys = await prisma.gbanSyncKey.findMany()
		let k2: {[a: string]: string} = {};
		for (const key of keys) {
			k2[key.key] = key.handlerId
		}
		gbanSyncKeys = k2
	} catch {}
}, 2500);

app.post("/sync/ban", async({ body })=>{
	if (!gbanSyncKeys[body.key]) {
		return error(403, { ok: false, message: "Invalid GBAN provider" })
	}
	try {
		await prisma.robloxUserBan_ThirdPartyFed.create({
			data: {
				userId: body.userid,
				reason: body.reason,
				moderatorId: body.moderatorId,
				banHandlerId: gbanSyncKeys[body.key] || "unknown"
			}
		})
		return error(200, { ok: true })
	} catch {
		return error(400, { ok: false, message: `User is already banned` })
	}
}, {
	tags: ["sync"],
	body: t.Object({
		userid: t.String({ minLength: 1, maxLength: 32, description: "Public Roblox UserId of the user who you're banning" }),
		moderatorId: t.String({ minLength: 1, maxLength: 32, description: "Discord ID of the moderator" }),
		reason: t.String({ minLength: 5, maxLength: 512, description: "Reason for the user's ban"}),
		key: t.String({ maxLength: 128, description: "API key to ban users" })
	}),
	response: {
		200: t.Object({
			ok: t.Boolean()
		}),
		403: t.Object({
			ok: t.Boolean(),
			message: t.String({ default: "Invalid GBAN provider" })
		}),
		400: t.Object({
			ok: t.Boolean(),
			message: t.String({ default: "User is already banned." })
		})
	}
});

app.post("/sync/unban", async({ body })=>{
	if (!gbanSyncKeys[body.key]) {
		return error(403, { ok: false, message: "Invalid GBAN provider" })
	}
	try {
		await prisma.robloxUserBan_ThirdPartyFed.delete({
			where: {
				userId_banHandlerId: {
					userId: body.userid,
					banHandlerId: gbanSyncKeys[body.key] || "unknown"
				}
			}
		})
		return error(200, { ok: true })
	} catch {
		return error(400, { ok: false, message: `User is not banned` })
	}
}, {
	tags: ["sync"],
	body: t.Object({
		userid: t.String({ minLength: 1, maxLength: 32, description: "Public Roblox UserId of the user who you're unbanning" }),
		key: t.String({ maxLength: 128, description: "API key to unban users" })
	}),
	response: {
		200: t.Object({
			ok: t.Boolean()
		}),
		403: t.Object({
			ok: t.Boolean(),
			message: t.String({ default: "Invalid GBAN provider" })
		}),
		400: t.Object({
			ok: t.Boolean(),
			message: t.String({ default: "User is not banned." })
		})
	}
});

app.use(aiRouter);

/*
app.use(express.json());
app.use(formRouter);
*/
