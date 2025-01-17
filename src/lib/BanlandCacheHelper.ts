import { RobloxUserBan } from "@prisma/client";
import { GetAllBans } from "../services/Database/helpers/RobloxBan";
import { BanlandScope } from "./Constants";
import { BanlandEntry } from "./Types";
import { logger } from "./Utility";

/**
 *  The banland cache helper, helps prevent MASSIVE spikes in disk usage.
 */
export class BanlandCacheHelper {
	/**
	 *  Initalizes the banland cache helper.
	 *
	 *  @param scope The ban scope.
	 */
	constructor(public readonly scope: BanlandScope) {}

	protected cachedBanlandJSON = "{}";
	protected bans: { [userid: string]: BanlandEntry } = {};

	public _updateBanCountFunc: (a: number) => void = (a: number) => {};

	public getBans(): { [userid: string]: BanlandEntry } {
		return this.bans;
	}

	/**
	 *  Invalidates the current cache and generates a new one.
	 */
	public async RefreshBanlandCache(): Promise<void> {
		const a = await GetAllBans();
		this._updateBanCountFunc(a.length);
		let b: { [userid: string]: BanlandEntry } = {};
		a.forEach((u: RobloxUserBan) => {
			if (this.scope !== "All") {
				if (u.bannedFrom !== this.scope) return;
			}
			b[u.userId] = {
				Reason: u.reason,
				Moderator: u.moderatorName,
				Expiry: u.bannedUntil,
			};
		});
		this.cachedBanlandJSON = JSON.stringify(b);
	}

	/**
	 *  Returns the raw JSON data of the banland.
	 */
	public async GetCachedBanland(): Promise<string> {
		return this.cachedBanlandJSON;
	}
}

let AllBanlandCacheHelpers: BanlandCacheHelper[] = [];

/**
 * Registers a banland cache with the manager.
 * @param helper The banland cache.
 */
export function AddToBanlandCacheManager(helper: BanlandCacheHelper): void {
	logger.info(`Registering BanlandCacheHelper with scope "${helper.scope}".`);
	AllBanlandCacheHelpers.push(helper);
}

/**
 *  Rebilds ALL of the banlands registered with the AddToBanlandCacheManager function.
 */
export async function RefreshAllBanlands(): Promise<void> {
	AllBanlandCacheHelpers.forEach(async (h: BanlandCacheHelper) => {
		await h.RefreshBanlandCache();
	});
}
