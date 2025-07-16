export function createMutex() {
	let locked = false;
	const waiting: (() => void)[] = [];

	return {
		lock: async () => {
			if (locked) {
				return new Promise<void>((resolve) => {
					waiting.push(resolve);
				});
			} else {
				locked = true;
			}
		},
		unlock: () => {
			if (waiting.length > 0) {
				const resolve = waiting.shift();
				if (resolve) {
					resolve();
					locked = true;
				}
			} else {
				locked = false;
			}
		},
		isLocked: () => locked
	};
}
