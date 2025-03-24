import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { fetchWithTimeout } from "@112/Utility";

const meta: FunctionDeclaration = {
	name: "urban",
	description:
		"Searches Urban Dictionary for the definition of a given query.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "urbanDefine parameters",
		properties: {
			query: {
				description: "The word or slang to search for.",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	query: "skid"
});

async function func(args: any): Promise<any> {
	const r = await fetchWithTimeout(
		`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(
			args.query
		)}`
	);
	return await r.json();
}

registerTool(func, meta);
