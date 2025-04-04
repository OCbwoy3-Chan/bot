import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { GetUserDetails, GetUserIdFromName } from "../../../../../lib/roblox";
import { addTest, registerTool } from "../../tools";
import { getUserBanStatus } from "@db/GBanProvider";

const meta: FunctionDeclaration = {
	name: "gban.get_user",
	description:
		"Gets a user's ban status from all connected systems, especially 112, the main provider. All details are publicly available and should not be obscured. -1 = Banned Forever",
	parameters: {
		required: [],
		type: SchemaType.OBJECT,
		description: "getBanInfo parameters",
		properties: {
			username: {
				description:
					"The Roblox user's Username (NOT USERID, use resolveRobloxId to obtain the name)",
				type: SchemaType.STRING
			},
			userid: {
				description: "The Roblox user's User ID",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	userid: "1523324373"
});

async function func(args: any): Promise<any> {
	const username = args.username as string;
	const userid2 = args.userid as string;
	let userid = userid2;

	if (!userid2 && username) {
		userid = (await GetUserIdFromName(username))?.toString() || "";
	}
	if (!userid) throw "Cannot resolve Name to UserId";

	const details = await GetUserDetails(userid);

	const gb = await getUserBanStatus(userid.toString());

	return {
		userInfo: {
			displayName: details.displayName,
			userName: details.username,
			userId: userid,
			bannedFromRoblox: details.isBanned
		},
		// banProviders: Object.keys(gb),
		bans: gb
	};
}

registerTool(func, meta);
