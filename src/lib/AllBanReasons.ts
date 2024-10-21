// Roblox ban reasons from https://roblox.fandom.com/wiki/Account_moderation#Reasons_&_moderator_notes
// ALL Ban Reasons

export const OwnerLockedBanReasonPresets = [ "LEGACY_112_BAN" ]

export const AllBanReasons = {

	CUSTOM_REASON: "Unspecified",
	LEGACY_112_BAN: "Legacy 112 Ban - ocbwoy3.dev/appeal",

	TOS_VIOLATION: "Severe Roblox TOS violation",
	PEDOPHILIA: "Actions related to pedophilia",

	SEX: "Participating in Sexual Activities",
	HATE_SPEECH: "Hate speech",
	HARASSMENT: "Harassment towards community members",

}

export type AnyBanReason = string
