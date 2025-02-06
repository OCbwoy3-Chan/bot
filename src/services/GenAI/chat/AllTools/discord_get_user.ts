import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { client } from "../../../Bot/bot";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "discord.get_user",
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

addTest(meta.name,{
	id: "486147449703104523"
});

async function func(args: any): Promise<any> {
	const id = args.id as string;
	const u = await client.users.fetch(id);
	// console.log(u);
	return {
		name: u.displayName,
		id: u.id,
		userJson: u.toJSON(),
	};
}

registerTool(func, meta);
