import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { getAllBans, getAllGbanProviders } from "@db/GBanProvider";
import { GetUserDetails } from "@112/roblox";

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

type Filter = {
	providers?: string[];
};

const meta: FunctionDeclaration = {
	name: "gban.find",
	description:
		"Retrieves all PUBLIC bans and global bans (gbans) from all connected systems, especially 112, the main provider. Details are publicly available and should not be obscured. -1 = Banned Forever",
	parameters: {
		required: ["filters"],
		type: SchemaType.OBJECT,
		description: "findBans parameters",
		properties: {
			filters: {
				description: "Max 10 filters per request",
				type: SchemaType.ARRAY,
				items: {
					description:
						"Only one entry provider/filter/verified/etc. per filter.",
					type: SchemaType.OBJECT,
					properties: {
						providers: {
							type: SchemaType.ARRAY,
							items: {
								type: SchemaType.STRING,
								enum: getAllGbanProviders().map((a) => a.name)
							}
						}
					}
				}
			}
		}
	}
};

addTest(meta.name, {
	filters: [
		{
			providers: ["112", "112x4"]
		}
	]
});

async function func(args: any): Promise<any> {
	let gb = await getAllBans();

	const filters: Filter[] = args.filters;

	for (const filter of filters) {
		if (filter.providers) {
			const filteredGb: any = {};
			for (const provider of filter.providers) {
				if (gb[provider]) {
					filteredGb[provider] = gb[provider];
				}
			}
			gb = filteredGb;
		}
	}

	for (const [provider, bans] of Object.entries(gb)) {
		if (bans) {
			const promises: Promise<void>[] = [];
			for (const [id, data] of Object.entries(bans)) {
				promises.push(
					(async () => {
						try {
							const details = await GetUserDetails(id);
							bans[id].otherMetadata =
								bans[id].otherMetadata || {};
							bans[id].otherMetadata.displayName =
								details.displayName;
							bans[id].otherMetadata.username = details.username;
						} catch {}
					})()
				);
			}
			await Promise.all(promises);
			gb[provider] = bans;
		}
	}

	return {
		bans: gb
	};
}

registerTool(func, meta);
