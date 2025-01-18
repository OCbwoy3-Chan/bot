import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { GetUserDetails } from "../../../../lib/roblox";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "resolveRobloxId",
	description:
		"Resolves a Roblox UserID to user details including name, display name, etc.",
	parameters: {
		required: ["userid"],
		type: SchemaType.OBJECT,
		description: "resolveRobloxId parameters",
		properties: {
			userid: {
				description: "The Roblox user's UserID",
				type: SchemaType.STRING,
			},
		},
	},
};

addTest(meta.name,{
	userid: "1083030325"
});

async function func(args: any): Promise<any> {
	const userid = args.userid as string;
	const userinfo = await GetUserDetails(userid);
	if (!userinfo) throw "Cannot resolve UserId";

	return {
		userid: userid,
		...userinfo,
	};
}

registerTool(func, meta);
