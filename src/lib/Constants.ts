// Enviorment

export type BanlandScope = "SB" | "OCbwoy3sMultiverse" | "All";
export const AllBanlandScopes = ["SB", "OCbwoy3sMultiverse", "All"];

export const RobloxHostASNWhitelist: string[] = [
	"AS22697" // Roblox
];
export const RobloxUserAgentWhitelist: string[] = ["Roblox/Linux"];

// 10€ roblox gift card

export const AllBanDurations: [string, number][] = [
	["Forever", -1],
	["1 day", 60 * 60 * 24],
	["1 week", 60 * 60 * 24 * 7],
	["1 month (31d)", 60 * 60 * 24 * 31],
	["3 months (91d)", 60 * 60 * 24 * 91],
	["1 year", 60 * 60 * 24 * 365],
	["2 years", 60 * 60 * 24 * 365 * 20],
	["5 years", 60 * 60 * 24 * 365 * 5],
	["10 years", 60 * 60 * 24 * 365 * 10]
];

export const ServerPort: number = 8080;
export const UserIdResolveCacheWipeInterval: number = 300_000;
export const BanlandCheckInterval: number = 60_000;
export const IPLogsChannel: string = process.env.IPLogsChannel as string;
