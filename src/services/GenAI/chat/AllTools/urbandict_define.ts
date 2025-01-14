import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "urbanDefine",
	description:
		"Searches Urban Dictionary for the definition of the given query, most likely slang.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "urbanDefine parameters",
		properties: {
			query: {
				description: "Words to search for",
				type: SchemaType.STRING,
			},
		},
	},
};

async function func(args: any): Promise<any> {
	const r = await fetch(
		`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(
			args.query
		)}`
	);
	return await r.json();
}

registerTool(func, meta);
