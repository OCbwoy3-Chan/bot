import { logger } from "@112/Utility";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let EMOJIS: { [k: string]: string } = {
	// AI EMOJIS

	ai_sebsilly: "",
	ai_sillycat: ":3",

	// BOT INTERACTION COMPONENTS

	MemoryUpdate: "📓",
	AT_Protocol: "🦋",
	DuckDuckGo: "🪿",
	Playwright: "🎭",
	Exaroton: "⛏️",
	Fandom: "🔬"
} as const;

type Emoji =
	| "MemoryUpdate"
	| "AT_Protocol"
	| "DuckDuckGo"
	| "Playwright"
	| "Exaroton"
	| "Fandom";

const emojisFilePath = join(__dirname, "../../../emojis.json");

function loadEmojis(): Record<string, string> {
	try {
		if (existsSync(emojisFilePath)) {
			const data = readFileSync(emojisFilePath, "utf-8");
			return JSON.parse(data);
		}
	} catch (error) {
		logger.error("Failed to load emojis from emojis.json:", error);
	}
	return {};
}

const loadedEmojis = loadEmojis();

for (const key in loadedEmojis) {
	if (loadedEmojis[key]) {
		EMOJIS[key] = loadedEmojis[key];
	}
}

export function getEmoji(name: Emoji): string {
	return EMOJIS[name] || "";
}

export function getEmojiForAI(name: string): string {
	return EMOJIS[`ai_${name.toLowerCase()}`] || "";
}
