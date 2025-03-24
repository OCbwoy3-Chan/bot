export abstract class FederatedInstance {
	constructor(
		public name: string,
		public rootUrl: string
	) {}

	public async banUser(id: string, reason: string) {}
	public async unbanUser(id: string) {}
}
