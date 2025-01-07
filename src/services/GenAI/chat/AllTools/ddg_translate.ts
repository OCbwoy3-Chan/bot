import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { translate } from "@navetacandra/ddg";
import { registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "duckduckgoTranslate",
	description: "Translates the provied query on DuckDuckGo.",
	parameters: {
		required: ["target", "query"],
		type: SchemaType.OBJECT,
		description: "Translate parameters",
		properties: {
			target: {
				description: "Target language ISO 639 alpha-2 code",
				type: SchemaType.STRING,
			},
			query: {
				description: "String to translate",
				type: SchemaType.STRING,
			},
		},
	},
};

async function func(args: any): Promise<any> {
	const query = (args as any).query as string;
	const targetLangISO639 = (args as any).target as string;

	const translated = await translate(query, "", targetLangISO639);

	return {
		detected_lang: translated.detected_language,
		translated: translated.translated,
	};
}

registerTool(func, meta);
