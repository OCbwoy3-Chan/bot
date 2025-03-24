import { FunctionDeclaration } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { getAllBans } from "@db/GBanProvider";

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
		"Retrieves all PUBLIC bans and global bans (gbans) from all connected systems, especially 112, the main provider. Details are publicly available and should not be obscured. -1 = Banned Forever"
};

addTest(meta.name, null);

async function func(args: any): Promise<any> {

	const gb = await getAllBans();

	return {
		// banProviders: Object.keys(gb),
		bans: gb
	};
}

registerTool(func, meta);
