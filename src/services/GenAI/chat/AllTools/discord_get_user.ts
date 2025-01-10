import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { hostname } from "os";
import { getPresence } from "../../../Server/router/stats";
import { client } from "../../../Bot/bot";

const meta: FunctionDeclaration = {
	name: "getDiscordUser",
	description: "Gets the information about the given Discord User.",
	parameters: {
		required: ["id"],
		type: SchemaType.OBJECT,
		description: "getDiscordUser parameters",
		properties: {
			id: {
				description: "The Discord User's ID.",
				type: SchemaType.STRING,
			},
		},
	},
};

async function func(args: any): Promise<any> {
	const id = args.id as string;
	const u = await client.users.fetch(id);
	// console.log(u);
	return {
		name: u.displayName,
		id: u.id,
		userJson: u.toJSON()
	};
}

registerTool(func, meta);

