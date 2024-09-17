import { getIdFromUsername, getPlayerInfo, PlayerInfo } from "noblox.js";
import { UserIdResolveCacheWipeInterval } from "./Constants";
import { logger } from "./Utility";

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
	try {
		const d = await getPlayerInfo(userid);
		playerInfoCache[userid] = d;
		return d;
	} catch(e_) {
		logger.child({error:e_}).info("Shitty code, Error!");
	};
	return playerInfoCache[userid] || {} as PlayerInfo;
}

// someone can switch their roblox username with someone elses, fucking up this caching thing or whatever the fuck this monstrosity is
// breaks my fucking code
setTimeout(()=>{
	usernameIdCache = {};
},UserIdResolveCacheWipeInterval);
