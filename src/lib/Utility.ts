import { readFileSync } from "fs";
import { arch, platform } from "os";
import { performance } from "perf_hooks";
import { Logger } from "pino";

export const logger: Logger = require("pino")({});

let _is112Fork: boolean = true;

export function _setIsFork(val: boolean): void {
	_is112Fork = val;
}

// Gets if the current version of 112 is a fork
export function isFork() {
	return _is112Fork;
}

export function measureCPULatency(): string {
	const start = performance.now();
	const comparison = 9 + 10 === 21;
	const end = performance.now();
	// latency in microseconds
	const latency = end - start;
	return `${Math.ceil(latency)}`;
}

export async function getDistroName(): Promise<string> {
	return await new Promise((resolve) => {
		setTimeout(() => {
			resolve(`getDistroName timeout - ${arch()}`)
		}, 500);
		try {
			const d = readFileSync("/etc/os-release").toString().split("\n");
			if (/nix\-snowflake/.test(d.join("\n"))) return "NixOS";
			d.forEach((a: string) => {
				if (a.startsWith("PRETTY_NAME=")) {
					resolve(a.replace(/(^PRETTY_NAME=\"?)|(\"?$)/g, "").trim());
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
		if (/nix\-snowflake/.test(d.join("\n"))) return "NixOS";
		let retval: string = platform();
		d.forEach((a: string) => {
			if (a.startsWith("PRETTY_NAME=")) {
				retval = a.replace(/(^PRETTY_NAME=\"?)|(\"?$)/g, "").trim();
			}
		});
		return retval;
	} catch {
		return platform();
	}
}
