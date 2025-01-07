import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { RegularResults, search } from "@navetacandra/ddg";
import { registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "duckduckgoSearch",
	description:
		"Searches the provied query on DuckDuckGo. Can also be used to retrieve the current ISO UTC+0 time, along the current UNIX millis.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "Seach parameters",
		properties: {
			query: {
				description: "Data to search for",
				type: SchemaType.STRING,
			},
		},
	},
};

async function func(args: any): Promise<any> {
	const searchResults = await search({
		query: (args as any).query as string,
	});
	let results = (searchResults.results as RegularResults).map((result) => {
		return {
			title: result.title,
			description: result.description,
			url: result.url,
		};
	});
	if (searchResults.next) {
		const searchResults2 = await search({
			query: (args as any).query as string,
			next: `${searchResults.next}`,
		});
		let results2 = (searchResults.results as RegularResults).map(
			(result) => {
				return {
					title: result.title,
					description: result.description,
					url: result.url,
				};
			}
		);
		results.push(...results2)
	}
	return {
		currentUnixMillis: Date.now(),
		currentTimeISO_UTC0: new Date().toISOString(),
		results,
	};
}

registerTool(func, meta);
