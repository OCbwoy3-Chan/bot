/// <reference lib="dom" />

import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";
import { JSDOM } from "jsdom";

const meta: FunctionDeclaration = {
	name: "ddg.search",
	description: "Performs a search query on DuckDuckGo.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "Seach parameters",
		properties: {
			query: {
				description: "The search query.",
				type: SchemaType.STRING
			}
			// safe_search: {
			// 	description: "Default STRICT. STRICT = No NSFW",
			// 	type: SchemaType.STRING,
			// 	enum: [
			// 		"OFF",
			// 		"MODERATE",
			// 		"STRICT"
			// 	]
			// }
		}
	}
};

addTest(meta.name, {
	query: "jammer kaiju paradise"
});

const userAgents = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
];

// #1 best duckduckgo scraping method imagined
export async function scrapeDuckduckgo(query: string) {
	const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

	const searchUrl = new URL("https://html.duckduckgo.com/html/")
	searchUrl.searchParams.append("q", query)
	const searchLink = searchUrl.toString()

	const websiteContent = await fetch(
		searchLink,
		{
			headers: {
				"User-Agent":
					userAgent
			}
		}
	);
	const theHtml = await websiteContent.text();

	let metadatas: { title: string; url: string; description: string }[] = [];

	const p = new JSDOM(theHtml) /*,{
		contentType: "text/html",
		url: searchLink,
		userAgent,
		runScripts: "outside-only"
	})*/

	for (const a of p.window.document.querySelectorAll(".results .result .result__body")) {
		const titleThing = a.querySelector(".result__a")!
		const desc = a.querySelector(".result__snippet")!

		// URL trickery: //duckduckgo.com/l/?uddg=https%3A%2F%2Focbwoy3.dev%2F -> https://ocbwoy3.dev

		const linkOriginal = desc.getAttribute("href")!;
		const link = new URL((!linkOriginal.startsWith("http") ? "https:" : "") + linkOriginal);

		metadatas.push({
			title: titleThing.innerHTML,
			url: link.searchParams.get("uddg")!,
			description: desc.innerHTML
		})
	}

	// console.log(metadatas);
	return metadatas
}


async function func(args: any): Promise<any> {
	return {
		results: await scrapeDuckduckgo(args.query)
	};
}

registerTool(func, meta);
