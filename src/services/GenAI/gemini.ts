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

	"Gemini 2.5 Flash-latest": {
		m: "gemini-2.5-flash",
		t: "1mil"
	},

	"Gemini 2.5 Flash-Lite": {
		m: "gemini-2.5-flash-lite-latest",
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
