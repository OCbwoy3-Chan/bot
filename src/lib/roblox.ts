import { getIdFromUsername, getPlayerInfo, PlayerInfo } from "noblox.js";

let usernameIdCache: {[username: string]: number} = {}

export async function GetUserIdFromName(username:string): Promise<number|null> {
	if (usernameIdCache[username.toLocaleLowerCase()]) {
		return usernameIdCache[username.toLowerCase()];
	}
	try {
		const userid = await getIdFromUsername(username.toLowerCase());
		usernameIdCache[username.toLowerCase()] = userid;
		return userid;
	} catch {}
	return null;
}

export async function GetUserDetails(userid: number): Promise<PlayerInfo> {
	return await getPlayerInfo(userid)
}
