import { GoogleGenAI } from "@google/generative-ai";
import { logger } from "../../lib/Utility";

let genai: GoogleGenAI | null = null;
let tokenPool: Array<{ name: string; token: string }> = [];
let currentTokenIndex = 0;
let fallbackToken: { name: string; token: string } | null = null;

export function initGemini(apiKey: string, tokenName?: string): GoogleGenAI {
	logger.info(
		`Creating new GoogleGenerativeAI(${tokenName || "unnamed token"})`
	);
	genai = new GoogleGenAI({
		apiKey
	});
	return genai;
}

export function setGeminiFallbackToken(
	apiKey: string | null,
	tokenName = "env"
): void {
	fallbackToken = apiKey ? { name: tokenName, token: apiKey } : null;
	if (tokenPool.length === 0 && fallbackToken) {
		initGemini(fallbackToken.token, fallbackToken.name);
	}
}

export function setGeminiTokenPool(
	tokens: Array<{ name: string; token: string }>
): void {
	tokenPool = tokens;
	currentTokenIndex = 0;
	const active = getActiveToken();
	if (active) {
		initGemini(active.token, active.name);
		return;
	}
	if (fallbackToken) {
		initGemini(fallbackToken.token, fallbackToken.name);
		return;
	}
	genai = null;
}

export function getGeminiTokenPoolSize(): number {
	if (tokenPool.length > 0) return tokenPool.length;
	return fallbackToken ? 1 : 0;
}

export function rotateGeminiToken(reason = "rate limit"): boolean {
	if (tokenPool.length <= 1) {
		return false;
	}
	currentTokenIndex = (currentTokenIndex + 1) % tokenPool.length;
	const active = getActiveToken();
	if (!active) return false;
	logger.warn(
		`Switching Gemini token to "${active.name}" due to ${reason}`
	);
	initGemini(active.token, active.name);
	return true;
}

export function getActiveGeminiTokenName(): string | null {
	const active = getActiveToken();
	return active?.name || null;
}

export function getGeminiInstance(): GoogleGenAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
}

export function areGenAIFeaturesEnabled(): boolean {
	return genai ? true : false;
}

export function isGeminiRateLimitError(error: unknown): boolean {
	const err = error as any;
	const status =
		err?.status ?? err?.statusCode ?? err?.code ?? err?.error?.code;
	if (status === 429) return true;
	const message =
		typeof err?.message === "string" ? err.message.toLowerCase() : "";
	const nestedMessage =
		typeof err?.error?.message === "string"
			? err.error.message.toLowerCase()
			: "";
	return (
		message.includes("rate limit") ||
		message.includes("too many requests") ||
		message.includes("resource exhausted") ||
		message.includes("quota") ||
		nestedMessage.includes("rate limit") ||
		nestedMessage.includes("too many requests") ||
		nestedMessage.includes("resource exhausted") ||
		nestedMessage.includes("quota")
	);
}

export async function testGeminiToken(apiKey: string): Promise<void> {
	const testClient = new GoogleGenAI({ apiKey });
	const session = testClient.chats.create({
		model: "gemini-2.0-flash-lite",
		config: {
			temperature: 0,
			topP: 0.95,
			topK: 40,
			maxOutputTokens: 1,
			responseMimeType: "text/plain"
		}
	});
	const resp = await session.sendMessage({
		message: ["ping"]
	});
	if (resp.promptFeedback) {
		throw resp.promptFeedback;
	}
	if (!resp.text) {
		throw "No response from Gemini";
	}
}

function getActiveToken(): { name: string; token: string } | null {
	if (tokenPool.length > 0) {
		return tokenPool[currentTokenIndex] || tokenPool[0] || null;
	}
	return fallbackToken;
}

export const AllVoiceModels: { [a: string]: string } = {
	"Gemini 2.5 Flash Preview Native Audio Dialog": "gemini-2.5-flash-preview-native-audio-dialog"
};

export const AllModels: { [a: string]: { m: string; t: string } } = {
	
	// GEMINI 2.5

	"Nano Banana (Gemini 2.5 Image)": {
		m: "gemini-2.5-image",
		t: "1mil"
	},

	"Gemini 2.5 Pro": {
		m: "gemini-2.5-pro",
		t: "1mil"
	},

	"Gemini Flash Latest": {
		m: "gemini-flash-latest",
		t: "1mil"
	},

	"Gemini Flash-Lite Latest": {
		m: "gemini-flash-lite-latest",
		t: "1mil"
	},


	// GEMINI 2.0

	"Gemini 2.0 Flash": {
		m: "gemini-2.0-flash",
		t: "1mil"
	},
	"Gemini 2.0 Flash Lite": {
		m: "gemini-2.0-flash-lite",
		t: "1mil"
	},

	// PREVIEW
	// "Gemini 2.0 Flash Experimental": { m: "gemini-2.0-flash-exp", t: "1mil" },

	"LearnLM 2.0 Flash Experimental": {
		m: "learnlm-2.0-flash-experimental",
		t: "1m"
	}
};
