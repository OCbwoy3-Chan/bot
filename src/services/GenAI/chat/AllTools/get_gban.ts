import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { GetUserDetails, GetUserIdFromName } from "../../../../lib/roblox";
import { prisma } from "../../../Database/db";

const meta: FunctionDeclaration = {
	name: "getBanInfo",
	description: "Checks is a Roblox user is banned from any GBan Provider. For 112, bannedUntil being -1 means that the user is is banned forever, otherwise it's the UNIX timestamp (in seconds), when the user is going to be unbanned. Make sure to tell the user, what GBan handler they're banned from.",
	parameters: {
		required: ["username"],
		type: SchemaType.OBJECT,
		description: "getBanInfo parameters",
		properties: {
			username: {
				description: "The Roblox user's Username",
				type: SchemaType.STRING,
			},
		},
	},
};

async function getNovaReason(
	endpoint: string,
	userid: string
): Promise<{ reason: string, attributionRequired: true } | { error: string } | null> {
	try {
		const bans = await (await fetch(endpoint)).json();
		return bans[userid] ? { reason: bans[userid].reason, attributionRequired: true } : null;
	} catch (e_) {
		return { error: `${e_} ` };
	}
}

async function func(args: any): Promise<any> {
	const username = args.username as string;
	const userid = await GetUserIdFromName(username);
	if (!userid) throw "Cannot resolve Name to UserId";

	const details = await GetUserDetails(userid);

	const b = await prisma.robloxUserBan.findFirst({
		where: {
			userId: {
				equals: userid.toString()
			}
		}
	})

	const banReasonS = b ? {
		reason: b.reason,
		bannedUntil: b.bannedUntil,
		moderator: b.moderatorName,
		moderatorDiscordId: b.moderatorId,
		attributionRequired: true
	} : null

	return {
		["*comment"]: {
			_000: "You just fetched information from Global Ban (GBan) handlers. You would state bans like `{USER} is banned from 112 for ...`",
			_001: `Do not use the user's name given in the input, preferably use the correctly capitalized versions in userInfo, e.g. "${details.displayName}" instead of "${details.username.toLowerCase()}"!`,
			_002: "You must use the user's Display Name indicating them being banned, optionally their username, PROPERLY CAPITALIZED, which can be found in userInfo! Always make sure to state their reason by default, unless explicitly told not to!"
		},
		userInfo: {
			displayName: details.displayName,
			userName: details.username,
			userId: userid,
			bannedFromRoblox: details.isBanned
		},
		gbans: {
			["112"]: banReasonS,
			Nova: await getNovaReason(
				"https://api.scriptlang.com/bans",
				userid.toString()
			),
			Karma: await getNovaReason(
				"https://karma.ocbwoy3.dev/bans",
				userid.toString()
			)
		}
	};
}

registerTool(func, meta);
