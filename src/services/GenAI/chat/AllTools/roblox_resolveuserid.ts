import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { GetUserDetails, GetUserIdFromName } from "../../../../lib/roblox";
import { prisma } from "../../../Database/db";

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

async function func(args: any): Promise<any> {
	const userid = args.userid as string;
	const userinfo = await GetUserDetails(userid);
	if (!userinfo) throw "Cannot resolve UserId";


	return {
		userid: userid,
		...userinfo
	}
}

registerTool(func, meta);
