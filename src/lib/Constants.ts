
// Enviorment

export const IPLogsChannel: string = process.env.IPLogsChannel as string

// All Ban Reasons

export const AllBanReasons = {

	// Extreme

	POLICE_INVESTIGATION: "Police investigation.",
	EUROPEAN_UNION_DSA_ABUSE: "Banned for abusing Illegal Content reporting.",
	EUROPEAN_UNION_DSA: "You have been banned for illegal activities.",
	// Only allow reporting this ONLY to people in the European Union!


	// 112 Reasons

	CUSTOM_REASON: "",
	BANNED_BY_REQUEST: "Banned by user request.",
	ANTIFUR: "Antifur behaviour is not allowed!",
	REMOTE_ADMIN_ABUSE: "Breaking rules with Remote Admins is not allowed!",
	ABUSING_SYSTEMS: "Abusing REM or 112 systems is not allowed!",

	// Roblox (https://roblox.fandom.com/wiki/Account_moderation#Reasons_&_moderator_notes)

	PROFANITY: "We do not allow profane language or slurs.",
	HARASSMENT: "We do not allow bullying or harassment towards community members.",
	SCAMMING: "Scamming is not allowed!",
	DISCRIMINATION: "Discriminatory behaviour is not allowed!",
	SEXUAL_CONTENT: "That kind of content is not allowed!",
	IMPERSONATION: "Impersonation is not allowed!",
	EXTORTION_OR_BLACKMAIL: "We do not allow threatening users in order to force them to do something they do not want to do.",
	ILLEGAL_OR_REGULATED: "We do not allow illegal or regulated content in any form.",
	POLITICAL_CONTENT: "We do not permit that kind of content.",
	CHILD_SAFETY: "Banned due to safety concerns.",
	OFFPLATFORM_BEHAVIOUR: "Banned for off-platform behaviour"

}

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
