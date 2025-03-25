export type TransformedGban = {
	userid?: string;
	reason: string;
	moderator?: string;
	verified?: boolean;
	isLocal?: boolean;
	propogatedFromGbanProvider?: string;
	otherMetadata?: {
		[a: string]: string | string[] | {
			[a: string]: string | string[]
		};
	};
};

export async function fetchWithTimeout(url: string, opts?: RequestInit) {
	const timeout = 2500;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(url, {
		...opts,
		signal: controller.signal
	});
	clearTimeout(id);

	if (controller.signal.aborted) {
		throw new Error(`Took too long to fetch ${url} (>${timeout}ms)`);
	}

	return response;
}

export type TransformedGbanSchema = {
	[id: string]: TransformedGban;
};

export abstract class GbanProvider {
	constructor(public name: string) {}

	public async getBans(): Promise<TransformedGbanSchema> {
		return {};
	}
	public async getBan(id: string): Promise<TransformedGban | null> {
		return null;
	}
}

let allGbanProviders: GbanProvider[] = [];

export function getAllGbanProviders(): GbanProvider[] {
	return allGbanProviders;
}

export function registerGbanProvider(p: GbanProvider) {
	allGbanProviders.push(p);
}

// Gets a user's ban status across all providers.
export async function getUserBanStatus(
	userId: string
): Promise<{ [provider: string]: TransformedGban | null }> {
	const userBanStatus: { [provider: string]: TransformedGban | null } = {};
	const banPromises = allGbanProviders.map(async (provider) => {
		try {
			const ban = await provider.getBan(userId);
			userBanStatus[provider.name] = ban;
		} catch (error) {
			console.error(
				`Error fetching ban for user ${userId} from provider ${provider.name}:`,
				error
			);
			userBanStatus[provider.name] = null;
		}
	});
	await Promise.all(banPromises);
	return userBanStatus;
}

// Gets all bans across all providers.
export async function getAllBans(): Promise<{
	[provider: string]: TransformedGbanSchema | null;
}> {
	const userBanStatus: { [provider: string]: TransformedGbanSchema | null } =
		{};
	const banPromises = allGbanProviders.map(async (provider) => {
		try {
			const ban = await provider.getBans();
			userBanStatus[provider.name] = ban;
		} catch (error) {
			console.error(
				`Error fetching bans from provider ${provider.name}:`,
				error
			);
			userBanStatus[provider.name] = null;
		}
	});
	await Promise.all(banPromises);
	return userBanStatus;
}
