import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";
import { LanguageName } from "@navetacandra/ddg/dist/types";
import { translate, languages } from "@navetacandra/ddg";

const meta: FunctionDeclaration = {
	name: "ddg.translate",
	description: "Translates a query into a target language using DuckDuckGo.",
	parameters: {
		required: ["target", "query"],
		type: SchemaType.OBJECT,
		description: "Translate parameters",
		properties: {
			target: {
				description: "The target language",
				type: SchemaType.STRING,
				enum: Object.values(languages)
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
	target: "English"
});

async function func(args: any): Promise<any> {
	const query = (args as any).query as string;
	const targetLangISO639 = (args as any).target as string;

	const translated = await translate(query, "", targetLangISO639 as LanguageName);

	return {
		detected_lang: translated.detected_language,
		translated: translated.text
	};
}

// registerTool(func, meta);
