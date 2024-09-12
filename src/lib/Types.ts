import { AnyBanReason } from "./AllBanReasons"
import { BanlandScope } from "./Constants"

// See RobloxUserBan in schema.prisma
export type BanParams = {
	UserID: string,
	Reason: string,
	BannedUntil: string|"-1", // UNIX Millis
	PrivateReason?: string,
	ModeratorId: string
	ModeratorName: string
	BannedFrom: BanlandScope,
	Nature: AnyBanReason
}

export type BanlandEntry = {
	Reason: string
	Moderator: string
	Expiry: string
	Scope: string
}
