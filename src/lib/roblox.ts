import { getIdFromUsername, getPlayerInfo, PlayerInfo } from "noblox.js";
import { UserIdResolveCacheWipeInterval } from "./Constants";
import { logger } from "./Utility";

let usernameIdCache: {[username: string]: number} = {};
let playerInfoCache: {[userid: string]: PlayerInfo} = {};

// https://users.roblox.com/v1/users/1083030325
type RobloxAPIResponse = {
	description: string,
	created: string,
	isBanned: boolean,
	externalAppDisplayName: null,
	hasVerifiedBadge: boolean,
	id: string,
	name: string,
	displayName: string
}

// saving me

async function getRawAccountDetails(userid: string): Promise<RobloxAPIResponse> {
	const d = await fetch(`https://users.roblox.com/v1/users/${userid}`);
	const j = await d.json() as RobloxAPIResponse;
	return j;
}

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
		const d = await getRawAccountDetails(userid.toString());
		const ad: PlayerInfo = {
			blurb: "",
			username: d.name,
			displayName: d.displayName,
			isBanned: d.isBanned,
			joinDate: new Date() // don't fucking care
		}
		playerInfoCache[userid] = ad;
		return ad;
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
