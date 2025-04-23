import { readFileSync } from "fs";
import { arch, platform } from "os";
import { performance } from "perf_hooks";
import { Logger } from "pino";

export const logger: Logger = require("pino")({
	base: {
		pid: null
	},
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true
		}
	}
});

let _is112Fork: boolean = true;

export function _setIsFork(val: boolean): void {
	_is112Fork = val;
}

let _isEuropean: boolean = true;

export function _setIsEuropean(val: boolean): void {
	_isEuropean = val;
}

// Gets if 112 is is hosted in the European Union
export function isEuropean() {
	return _isEuropean;
}

// Gets if the current version of 112 is a fork
export function isFork() {
	return _is112Fork;
}

let _currentCountry = "US";

// Gets the current country code
export function getCurrentCountryCode() {
	return _currentCountry;
}

export async function _determineEuropeanness(): Promise<void> {
	const EUROPEAN_COUNTRIES = [
		"BE",
		"CZ",
		"BG",
		"DK",
		"DE",
		"EE",
		"EL",
		"ES",
		"FR",
		"HR",
		"IE",
		"CY",
		"LT",
		"IT",
		"LV",
		"LU",
		"HU",
		"MT",
		"NL",
		"AT",
		"PL",
		"PT",
		"RO",
		"SI",
		"SK",
		"FI",
		"SE"
		// "UK" // brexit
	];
	if (process.env.BYPASS_EUROPEAN_CHECK === "1") {
		_setIsEuropean(false);
		logger.warn("Bypassing EU Check");
		return;
	}
	try {
		const response = await fetch("https://ipapi.co/json/");
		const data = await response.json();
		if (process.env.BYPASS_EUROPEAN_CHECK === "1") {
			_setIsEuropean(false);
			logger.warn("Bypassing EU Check");
		} else {
			_setIsEuropean(data.continent_code === "EU" ? true : false);
		}
		_currentCountry = data.country_code;
		logger.info(
			`${_currentCountry} - ${isEuropean() ? "" : "Not "}European!`
		);
	} catch (error) {
		logger.error(
			"Failed to determine Europeanness, defaulting to true",
			error
		);
		_setIsEuropean(true);
	}
}

_determineEuropeanness().catch((a) => {});

export function measureCPULatency(): string {
	const start = performance.now();
	// for (let i = 0; i < 20; i++) {
	const _uselessComparison = 9 + 10 === 21;
	// }
	const end = performance.now();
	// latency in microseconds
	const latency = end - start;
	return `${Math.ceil(latency)}`;
}

export async function getDistroName(): Promise<string> {
	return await new Promise((resolve) => {
		setTimeout(() => {
			resolve(`getDistroName timeout - ${arch()}`);
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
			const pl = platform();
			resolve(
				pl === "win32"
					? "Microsoft Windows"
					: pl === "darwin"
					? "macOS"
					: pl
			);
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
		const pl = platform();
		return pl === "win32"
			? "Microsoft Windows"
			: pl === "darwin"
			? "macOS"
			: pl;
	}
}

export async function fetchWithTimeout(url: string, opts?: any) {
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
