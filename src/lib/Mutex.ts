type CreatedMutex = {
	resolve: () => void;
	await: () => Promise<void>;
};

export function createMutex(): CreatedMutex {
	let resolveF = (...a: any) => {};

	const promise = new Promise((resolve, reject) => {
		resolveF = resolve;
	});

	return {
		resolve: () => {
			resolveF(1);
		},
		await: async () => {
			await promise;
			return;
		}
	};
}
