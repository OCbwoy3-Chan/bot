import { GoogleGenAI } from "@google/generative-ai";
import { logger } from "../../lib/Utility";

let genai: GoogleGenAI | null = null;

export function initGemini(apiKey: string): GoogleGenAI {
	logger.info(
		`Creating new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY)`
	);
	genai = new GoogleGenAI({
		apiKey
	});
	return genai;
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

export const AllModels: { [a: string]: { m: string; t: string } } = {
	// GEMINI 2.5
	"Gemini 2.5 Pro Experimental 02-05": {
		m: "gemini-2.5-pro-exp-03-25",
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
	"Gemini 2.0 Flash Experimental": { m: "gemini-2.0-flash-exp", t: "1mil" },
	"LearnLM 1.5 Pro Experimental": {
		m: "learnlm-1.5-pro-experimental",
		t: "32k"
	},

	// GEMINI 1.5

	"Gemini 1.5 Pro": { m: "gemini-1.5-pro", t: "2mil" },
	"Gemini 1.5 Flash": { m: "gemini-1.5-flash", t: "1mil" },
	"Gemini 1.5 Flash 8B": { m: "gemini-1.5-flash-8b", t: "1mil" }
};
