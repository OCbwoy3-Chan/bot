import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { translate } from "@navetacandra/ddg";
import { addTest, registerTool } from "../../tools";

const meta: FunctionDeclaration = {
	name: "ddg.translate",
	description: "Translates a query into a target language using DuckDuckGo.",
	parameters: {
		required: ["target", "query"],
		type: SchemaType.OBJECT,
		description: "Translate parameters",
		properties: {
			target: {
				description: "The target language ISO code (e.g., en).",
				type: SchemaType.STRING
			},
			query: {
				description: "The text to translate.",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	query: "Sveiki, Pasaule!",
	target: "de"
});

async function func(args: any): Promise<any> {
	const query = (args as any).query as string;
	const targetLangISO639 = (args as any).target as string;

	const translated = await translate(query, "", targetLangISO639);

	return {
		detected_lang: translated.detected_language,
		translated: translated.translated
	};
}

registerTool(func, meta);
