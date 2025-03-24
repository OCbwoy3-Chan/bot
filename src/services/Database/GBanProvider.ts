export type TransformedGban = {
	userid?: string,
	reason: string,
	moderator?: string,
	verified?: boolean,
	isLocal?: boolean,
	propogatedFromGbanProvider?: string,
	otherMetadata?: {
		[a: string]: string | string[]
	}
}

export type TransformedGbanSchema = {
	[id: string]: TransformedGban
}

export abstract class GbanProvider {
	constructor(public name: string) { }

	public async getBans(): Promise<TransformedGbanSchema> { return {} }
	public async getBan(id: string): Promise<TransformedGban | null> { return null; }
}

let allGbanProviders: GbanProvider[] = [];

export function registerGbanProvider(p: GbanProvider) {
	allGbanProviders.push(p);
}
