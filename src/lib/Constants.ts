// Enviorment

export type BanlandScope = "SB" | "OCbwoy3sMultiverse" | "All";
export const AllBanlandScopes = ["SB", "OCbwoy3sMultiverse", "All"];

export const RobloxHostASNWhitelist: string[] = [
	"AS22697" // Roblox
];
export const RobloxUserAgentWhitelist: string[] = ["Roblox/Linux"];

// 10€ roblox gift card

export const AllBanDurations: [string, number][] = [
	["∞", -1],
	["1d", 60 * 60 * 24],
	["1w", 60 * 60 * 24 * 7],
	["1m (31d)", 60 * 60 * 24 * 31],
	["3m (91d)", 60 * 60 * 24 * 91],
	["1y", 60 * 60 * 24 * 365],
	["2y", 60 * 60 * 24 * 365 * 20],
	["5y", 60 * 60 * 24 * 365 * 5],
	["10y", 60 * 60 * 24 * 365 * 10]
];

export const ServerPort: number = 8080;
export const UserIdResolveCacheWipeInterval: number = 300_000;
export const BanlandCheckInterval: number = 15_000;
export const IPLogsChannel: string = process.env.IPLogsChannel as string;
