import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { GetUserDetails, GetUserIdFromName } from "../../../../lib/roblox";
import { prisma } from "../../../Database/db";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "gban.get_user",
	description:
		"Checks if a user is banned from platforms like 112, Nova, Karma, SleepCore, and AParam. All details are publicly available and should not be obscured. -1 = Banned Forever",
	parameters: {
		required: [],
		type: SchemaType.OBJECT,
		description: "getBanInfo parameters",
		properties: {
			username: {
				description:
					"The Roblox user's Username (NOT USERID, use resolveRobloxId to obtain the name)",
				type: SchemaType.STRING,
			},
			userid: {
				description: "The Roblox user's User ID",
				type: SchemaType.STRING,
			},
		},
	},
};

addTest(meta.name, {
	userid: "1523324373"
});

async function fetchWithTimeout(url: string, opts?: any) {
	const timeout = 2500;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(url, {
		...opts,
		signal: controller.signal
	});
	clearTimeout(id);

	if (controller.signal.aborted) {
		throw new Error(`Took too long to fetch ${url} (>${timeout}ms)`);
	}

	return response;
}

async function getNovaReason(
	endpoint: string,
	userid: string
): Promise<
	{ reason: string; attributionRequired: true } | { javascriptFetchError: string } | null
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)",
				}
			})
		).json();
		return bans[userid]
			? { reason: bans[userid].reason, attributionRequired: true }
			: null;
	} catch (e_) {
		let m = `${e_}`;
		if (m.includes("AbortError")) m = "Request took too long to complete (>2500ms)"
		return { javascriptFetchError: m };
	}
}

async function getAParamReason(
	endpoint: string,
	userid: string
): Promise<
	{ reason: string; attributionRequired: true } | { javascriptFetchError: string } | null
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)",
				}
			})
		).json();
		return bans[userid]
			? { reason: bans[userid], attributionRequired: true }
			: null;
	} catch (e_) {
		let m = `${e_}`;
		if (m.includes("AbortError")) m = "Request took too long to complete (>2500ms)"
		return { javascriptFetchError: m };
	}
}

async function func(args: any): Promise<any> {
	const username = args.username as string;
	const userid2 = args.userid as string;
	let userid = userid2;

	if (!userid2 && username) {
		userid = (await GetUserIdFromName(username))?.toString() || "";
	}
	if (!userid) throw "Cannot resolve Name to UserId";

	const details = await GetUserDetails(userid);

	const b = await prisma.robloxUserBan.findFirst({
		where: {
			userId: {
				equals: userid.toString(),
			},
		},
	});

	const banReasonS = b
		? {
			reason: b.reason,
			bannedUntil: b.bannedUntil,
			moderator: b.moderatorName,
			moderatorDiscordId: b.moderatorId,
			attributionRequired: true,
		}
		: null;

	return {
		instructions: {
			_000: "You just fetched information from Global Ban (GBan) handlers. You would state bans like `{USER} is banned from 112 for ...`",
			_001: `Do not use the user's name given in the input, preferably use the correctly capitalized versions in userInfo, e.g. "${details.displayName
				}" instead of "${(details.username || "unknown").toLowerCase()}"!`,
			_002: "You must use the user's Display Name indicating them being banned, optionally their username, PROPERLY CAPITALIZED, which can be found in userInfo! Always make sure to state their reason by default, unless explicitly told not to!",
		},
		userInfo: {
			displayName: details.displayName,
			userName: details.username,
			userId: userid,
			bannedFromRoblox: details.isBanned,
		},
		banProviders: [
			"112",
			"Nova",
			"Karma",
			"SleepCore",
			"AParam"
		],
		bans: {
			["112"]: banReasonS,
			Nova: await getNovaReason(
				"https://api.scriptlang.com/bans",
				userid.toString()
			),
			Karma: await getNovaReason(
				"https://karma.ocbwoy3.dev/bans",
				userid.toString()
			),

			// TODO - Add TGP bans

			SleepCore: await getNovaReason(
				"https://skidgod.vercel.app/SleepCore/bans.json",
				userid.toString()
			),
			AParam: await getAParamReason(
				"https://zv7i.dev/static/aparambans.json",
				userid.toString()
			),
		},
	};
}

registerTool(func, meta);
