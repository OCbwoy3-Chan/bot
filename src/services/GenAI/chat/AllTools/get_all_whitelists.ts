import { FunctionDeclaration } from "@google/generative-ai";
import { prisma } from "../../../Database/db";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "wl.get_all",
	description:
		"Retrieves all whitelists (linked roblox accounts, people with banning and ai permissions)",
};

addTest(meta.name, null);

async function func(args: any): Promise<any> {

	return {
		robloxAccountWhitelists: (await prisma.whitelist_RobloxUser.findMany()).filter(a=>!a.hidden),
		banWhitelist: (await prisma.whitelist.findMany()).filter(a=>!a.hidden),
		aiWhitelist: (await prisma.whitelist_OCbwoy3ChanAI.findMany()).filter(a=>!a.hidden),
	};
}

registerTool(func, meta);
