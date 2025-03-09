import { FunctionDeclaration } from "@google/generative-ai";
import { prisma } from "../../../Database/db";
import { addTest, registerTool } from "../tools";

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

const meta: FunctionDeclaration = {
	name: "gban.get_all",
	description:
		"Retrieves all PUBLIC AND PRIVATE bans (Gbans) from systems like 112, Nova, Karma and SleepCore. Details are publicly available and should not be obscured. -1 = Banned Forever",
};

addTest(meta.name, null);

async function getNovaReason(
	endpoint: string
): Promise<
	any
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)",
				},
			})
		).json();
		return bans
	} catch (e_) {
		let m = `${e_}`;
		if (m.includes("AbortError")) m = "Request took too long to complete (>2500ms)"
		return { error: m };
	}
}

async function func(args: any): Promise<any> {

	const b = await prisma.robloxUserBan.findMany();

	const banReasonS = b
		? b.map(d => {
			return {
				reason: d.reason,
				bannedUntil: d.bannedUntil,
				moderator: d.moderatorName,
				moderatorDiscordId: d.moderatorId
			}
		})
		: null;

	return {
		banProviders: [
			"112",
			"Nova",
			"Karma",
			"SleepCore"
		],
		bans: {
			["112"]: banReasonS,
			Nova: await getNovaReason(
				"https://nova.scriptlang.com/api/bans"
			),
			Karma: await getNovaReason(
				"https://karma.ocbwoy3.dev/bans"
			),

			// TODO - Add TGP bans

			SleepCore: await getNovaReason(
				"https://skidgod.vercel.app/SleepCore/bans.json"
			)
		}
	};
}

registerTool(func, meta);
