import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { RegularResults, search } from "@navetacandra/ddg";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "ddg.search",
	description:
		"Performs a search query on DuckDuckGo.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "Seach parameters",
		properties: {
			query: {
				description: "The search query.",
				type: SchemaType.STRING,
			},
		},
	},
};

addTest(meta.name,{
	query: "DuckDuckGo"
});

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
		let results2 = (searchResults2.results as RegularResults).map(
			(result) => {
				return {
					title: result.title,
					description: result.description,
					url: result.url,
				};
			}
		);
		results.push(...results2);
	}
	return {
		results,
	};
}

registerTool(func, meta);
