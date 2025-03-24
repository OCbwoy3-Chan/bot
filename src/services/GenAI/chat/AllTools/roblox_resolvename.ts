import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { GetUserDetails, GetUserIdFromName } from "../../../../lib/roblox";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "roblox.name2info",
	description:
		"Resolves a Roblox username into user details like name, display name, user ID, etc.",
	parameters: {
		required: ["username"],
		type: SchemaType.OBJECT,
		description: "resolveRobloxName parameters",
		properties: {
			username: {
				description: "The Roblox user's username",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	username: "OCboy3"
});

async function func(args: any): Promise<any> {
	const username = args.username as string;
	const userid = await GetUserIdFromName(username);
	if (!userid) throw "Cannot resolve UserId";
	const userinfo = await GetUserDetails(userid);

	return {
		userid: userid,
		...userinfo
	};
}

registerTool(func, meta);
