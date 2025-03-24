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
	hackBan?: boolean;
	noFederate?: boolean;
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
	hackBan?: boolean;
	noFederate?: boolean;
};

export type BanlandEntry = {
	Reason: string;
	Moderator: string;
	Expiry: string;
};
