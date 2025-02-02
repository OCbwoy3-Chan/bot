import fs from "fs";
import path from "path";
import { logger } from "../../lib/Utility";
import { FederatedInstance } from "./FederatedInstance";
import { prisma } from "./db";
import { UnbanUser } from "./helpers/RobloxBan";

const registeredInstances: FederatedInstance[] = [];

/**
 * Registers a federated instance.
 * @param instance The instance to register
 */
export function registerFederatedInstance(instance: FederatedInstance): void {
	logger.info(`Registering federated instance: ${instance.name}`);
	registeredInstances.push(instance);
}

/**
 * Gets all registered federated instances.
 * @returns An array of registered federated instances
 */
export function getRegisteredFederatedInstances(): FederatedInstance[] {
	return registeredInstances;
}

/**
 * Bans a user across all federated instances.
 * @param userId The ID of the user to ban
 * @returns A promise that resolves when all ban operations are complete, returns an array of ban providers who refused to ban the user.
 */
export async function banUserAcrossFederations(
	userId: string,
	reason: string
): Promise<string[]> {
	let fails: string[] = [];
	const banPromises = registeredInstances.map(
		(instance) =>
			new Promise((resolve) => {
				const p = instance
					.banUser(userId, reason)
					.then(() => {
						resolve(true);
					})
					.catch((e) => {
						fails.push(instance.name);
						logger.error(
							`[FEDERATION] Failed to ban user ${userId} from ${instance.name} - ${e}`
						);
					});
				resolve(p);
			})
	);
	await Promise.all(banPromises);
	return fails;
}

/**
 * Unbans a user across all federated instances.
 * @param userId The ID of the user to unban
 * @returns A promise that resolves when all unban operations are complete, returns an array of ban providers who refused to unban the user.
 */
export async function unbanUserAcrossFederations(
	userId: string
): Promise<string[]> {
	let fails: string[] = [];
	const unbanPromises = registeredInstances.map(
		(instance) =>
			new Promise((resolve) => {
				const p = instance
					.unbanUser(userId)
					.then(() => {
						resolve(true);
					})
					.catch((e) => {
						fails.push(instance.name);
						logger.error(
							`[FEDERATION] Failed to unban ${userId} from ${instance.name} - ${e}`
						);
					});
				resolve(p);
			})
	);
	await Promise.all(unbanPromises);
	return fails;
}

export async function federateHackbans(): Promise<void> {
	const fed_hack = await prisma.robloxUserBan.findMany()
	for (const user of fed_hack) {
		if ((Number(user.bannedUntil)*1000 < Date.now()) && (user.bannedUntil !== "-1")) {
			try {
				await UnbanUser(user.userId);
			} catch {}
		} else {
			if (user.hackBan) {
				await banUserAcrossFederations(user.userId, user.reason);
				await new Promise(resolve => setTimeout(() => { resolve(null) }, 200))
			}
		}
	}
}

export async function loadAllInstances() {
	const instancesPath = path.join(__dirname, "instances");

	(async () => {
		while (true) {
			await federateHackbans();
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	})();

	fs.readdirSync(instancesPath).forEach((file) => {
		if (file.endsWith(".ts")) {
			logger.info(
				`Registering instance for federation: instances/${file}`
			);
			try {
				require(path.join(instancesPath, file));
			} catch { }
		}
	});

}
