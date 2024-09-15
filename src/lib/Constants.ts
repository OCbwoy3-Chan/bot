// Enviorment

export type BanlandScope = "SB"|"OCbwoy3sMultiverse"|"All";
export const AllBanlandScopes = ["SB", "OCbwoy3sMultiverse", "All"];

export const AllBanDurations: [string,number][] = [
	["Forever",-1],
	["1 day",60*60*24],
	["1 week",60*60*24*7],
	["1 month (31d)",60*60*24*31],
	["3 months (91d)",60*60*24*91],
	["1 year",60*60*24*365],
	["2 years",60*60*24*365*20],
	["5 years",60*60*24*365*5]
]

export const ServerPort: number = 8080;
export const UserIdResolveCacheWipeInterval: number = 300_000;
export const IPLogsChannel: string = process.env.IPLogsChannel as string;

// All Permissions

export const AllPermissions = {

	// Developer Commands

	DEV_BYPASS: "Dev/Bypass",
	DEV_BASH: "Dev/BashCommand", // Invoke ANY bash command

	// User management

	USERS_ADD: "Users/Add",
	USERS_MODIFY: "Users/Modify",
	USERS_REMOVE: "Users/Remove",
	USERS_API: "Users/API",

	// GBan management

	GBANS_ADD: "112Bans/Add",
	GBANS_REMOVE: "112Bans/Remove",
	GBANS_MODIFY: "112Bans/Modify",

	// Appeal management

	APPEALS_VIEW: "112Appeals/View",
	APPEALS_ACT: "112Appeals/Act",
	APPEALS_DELETE: "112Appeals/Delete"
}

// Role Permissions

export const OwnerPermissions = Object.values(AllPermissions)

export const MemberPermissions = [
	AllPermissions.GBANS_ADD,
	AllPermissions.GBANS_MODIFY
];

export const ModeratorPermissions = [
	AllPermissions.GBANS_REMOVE,
	AllPermissions.APPEALS_VIEW,
	AllPermissions.APPEALS_ACT
];

// All Roles

export const AllRoles: {[id: string]:{name:string,permissions:string[]}} = {
	"0": {
		name: "Non-Member",
		permissions: []
	},
	"1": {
		name: "Member",
		permissions: MemberPermissions,
	},
	"2": {
		name: "Moderator",
		permissions: ModeratorPermissions,
	},
	"255": {
		name: "Owner",
		permissions: OwnerPermissions,
	}
}
