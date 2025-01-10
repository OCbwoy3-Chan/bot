import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { hostname } from "os";
import { getPresence } from "../../../Server/router/stats";
import { client } from "../../../Bot/bot";

const meta: FunctionDeclaration = {
	name: "getDiscordSelf",
	description: "Returns the current chatbot's Discord user info.",
};

async function func(args: any): Promise<any> {
	return client.user!.toJSON();
}

registerTool(func, meta);

