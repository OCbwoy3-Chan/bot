import { BanlandScope } from "./Constants";

// See RobloxUserBan in schema.prisma
export type BanParams = {
	UserID: string;
	Reason: string;
	BannedUntil: string | "-1"; // UNIX Millis
	PrivateReason?: string;
	ModeratorId: string;
	ModeratorName: string;
	BannedFrom: BanlandScope;
};

// See RobloxUserBan in schema.prisma
export type UpdateBanParams = {
	UserID: string;
	Reason?: string;
	BannedUntil: string | "-1"; // UNIX Millis
	PrivateReason?: string;
	ModeratorId?: string;
	ModeratorName?: string;
	BannedFrom: BanlandScope;
};

export type BanlandEntry = {
	Reason: string;
	Moderator: string;
	Expiry: string;
};
