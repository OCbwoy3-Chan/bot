import { readFileSync } from "fs";
import { platform } from "os";
import { performance } from "perf_hooks";
import { Logger } from "pino";

export const logger: Logger = require("pino")({});

export function measureCPULatency(): string {
	const start = performance.now();
	const comparison = 9 + 10 === 21;
	const end = performance.now();
	const latency = (end - start) * 1000; // Convert to nanoseconds
	return `${Math.ceil(latency)}`;
}

export async function getDistroName(): Promise<string> {
	return await new Promise((resolve) => {
		try {
			const d = readFileSync("/etc/os-release").toString().split("\n");
			d.forEach((a: string) => {
				if (a.startsWith("PRETTY_NAME=")) {
					resolve(a.replace(/(^PRETTY_NAME=\")|(\"$)/g, "").trim());
				}
			});
			resolve("Unknown Distro");
		} catch {
			resolve(platform());
		}
	});
}

export function getDistroNameSync(): string {
	try {
		const d = readFileSync("/etc/os-release").toString().split("\n");
		let retval: string = platform();
		d.forEach((a: string) => {
			if (a.startsWith("PRETTY_NAME=")) {
				retval = a.replace(/(^PRETTY_NAME=\")|(\"$)/g, "").trim();
			}
		});
		return retval;
	} catch {
		return platform();
	}
}
