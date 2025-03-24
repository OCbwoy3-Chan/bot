import { prisma } from "@db/db";

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
	| { reason: string; attributionRequired: true }
	| { javascriptFetchError: string }
	| null
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
				}
			})
		).json();
		return bans[userid]
			? { reason: bans[userid].reason, attributionRequired: true }
			: null;
	} catch (e_) {
		let m = `${e_}`;
		if (m.includes("AbortError"))
			m = "Request took too long to complete (>2500ms)";
		return { javascriptFetchError: m };
	}
}

async function getAParamReason(
	endpoint: string,
	userid: string
): Promise<
	| { reason: string; attributionRequired: true }
	| { javascriptFetchError: string }
	| null
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)"
				}
			})
		).json();
		return bans[userid]
			? { reason: bans[userid], attributionRequired: true }
			: null;
	} catch (e_) {
		let m = `${e_}`;
		if (m.includes("AbortError"))
			m = "Request took too long to complete (>2500ms)";
		return { javascriptFetchError: m };
	}
}

export async function getBanReasonsForUserid(userid: string): Promise<Object> {
	return {
		["112"]: await prisma.robloxUserBan.findFirst({
			where: { userId: userid.toString() }
		}),
		Nova: await getNovaReason(
			"https://nova.scriptlang.com/api/bans",
			userid.toString()
		),
		Karma: await getNovaReason(
			"https://karma.ocbwoy3.dev/bans",
			userid.toString()
		),
		SleepCore: await getNovaReason(
			"https://skidgod.vercel.app/SleepCore/bans.json",
			userid.toString()
		)
	};
}
