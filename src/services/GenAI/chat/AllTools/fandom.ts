import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";

function transformToApiUrl(wikiUrl: string) {
    try {
        const url = new URL(wikiUrl);
        const wikiName = url.hostname.split('.')[0];
        const pageTitle = decodeURIComponent(url.pathname.replace('/wiki/', ''));

        return `https://${wikiName}.fandom.com/api.php?action=query&prop=revisions&titles=${encodeURIComponent(pageTitle)}&rvprop=content&format=json`;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}

// Example usage

const meta: FunctionDeclaration = {
	name: "fandom",
	description:
		"Gets text from a page in a fandom.com wiki. Prefer this over using the puppeteer tool.",
	parameters: {
		required: [],
		type: SchemaType.OBJECT,
		description: "fandom parameters",
		properties: {
			url: {
				description:
					"The {wikiName}.fandom.com/wiki/PAGE_NAME url to extract.",
				type: SchemaType.STRING,
			}
		},
	},
};

addTest(meta.name, {
	url: "https://regretevator.fandom.com/wiki/Melanie"
})

async function fetchWithTimeout(url: string, opts?: any) {
	const timeout = 25000;

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

async function func(args: any): Promise<any> {
	const j = await fetchWithTimeout(transformToApiUrl(args.url)!);
	return await j.json();
};

registerTool(func, meta);
