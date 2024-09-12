// Enviorment

export type BanlandScope = "SB"|"OCbwoy3sMultiverse"|"All"
export const AllBanlandScopes = ["SB", "OCbwoy3sMultiverse", "All"]

export const ServerPort: number = 8080;
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
