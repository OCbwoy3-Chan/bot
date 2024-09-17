import { getIdFromUsername, getPlayerInfo, PlayerInfo } from "noblox.js";
import { UserIdResolveCacheWipeInterval } from "./Constants";

let usernameIdCache: {[username: string]: number} = {};
let playerInfoCache: {[userid: string]: PlayerInfo} = {};

// shitty code

export async function GetUserIdFromName(username:string): Promise<number|null> {
	if (usernameIdCache[username.toLocaleLowerCase().trim()]) {
		return usernameIdCache[username.toLowerCase().trim()];
	}
	try {
		const userid = await getIdFromUsername(username.toLowerCase().trim());
		usernameIdCache[username.toLowerCase().trim()] = userid;
		return userid;
	} catch {}
	return null;
}

export async function GetUserDetails(userid: number): Promise<PlayerInfo> {
	if (playerInfoCache[userid]) {
		return playerInfoCache[userid];
	}
	const d = await await getPlayerInfo(userid);
	playerInfoCache[userid] = d;
	return d;
}

// someone can switch their roblox username with someone elses, fucking up this caching thing or whatever the fuck this monstrosity is
// breaks my fucking code
setTimeout(()=>{
	usernameIdCache = {};
},UserIdResolveCacheWipeInterval);
