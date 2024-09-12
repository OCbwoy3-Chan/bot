// Roblox ban reasons from https://roblox.fandom.com/wiki/Account_moderation#Reasons_&_moderator_notes
// I imagine the goverment passing a law mandating Roblox to strictly moderate SB games. Maybe.
// ALL Ban Reasons

export const OwnerLockedBanReasonPresets = [ "LEGACY_112_BAN", "POLICE_INVESTIGATION", "EUROPEAN_UNION_DSA" ]

export const AllBanReasons = {

	// Stuff

	CUSTOM_REASON: "Unspecified",
	LEGACY_112_BAN: "Legacy 112 Ban - ocbwoy3.dev/appeal",
	ABUSING_SYSTEMS: "Abusing REM or 112 systems",
	WAR_CRIME: "Comitting war crimes",
	GENEVA_CONVENTION: "Violating the Geneva Convention",

	POLICE_INVESTIGATION: "You are under investigation by the police",
	EUROPEAN_UNION_DSA: "Illegal Content (EU DSA)",

	// Misc.

	REMOTE_ADMIN_ABUSE: "Abusing Remote Admins",
	NSFW_SCRIPT: "Running NSFW scripts",
	OFFPLATFORM_BEHAVIOUR: "Off-platform behaviour",

	// Bad stuff

	PROFANITY: "Profanities / slurs",
	HARASSMENT: "Harassment towards community members",
	POLITICAL_CONTENT: "Political content",

	// The really bad stuff

	SCAMMING: "Scamming",
	IMPERSONATION: "Impersonation",
	DISCRIMINATION: "Discriminatory behaviour",
	SEXUAL_CONTENT: "Sexual Content",
	EXTORTION_OR_BLACKMAIL: "Attempting to Extort/Blackmail someone",

	ANTIFUR: "Antifur behaviour",
	HOMOPHOBIA: "Homophobia",

	ILLEGAL_OR_REGULATED: "Illegal or regulated content",

	CHILD_SAFETY: "Child safety concerns"

}

export type AnyBanReason = string
