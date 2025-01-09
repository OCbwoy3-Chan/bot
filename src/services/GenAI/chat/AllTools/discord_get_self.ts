import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { hostname } from "os";
import { getPresence } from "../../../Server/router/stats";
import { client } from "../../../Bot/bot";

const meta: FunctionDeclaration = {
	name: "getDiscordSelf",
	description: "Gets the AI chatbot's Discord User information.",
};

async function func(args: any): Promise<any> {
	return client.user!.toJSON();
}

registerTool(func, meta);

