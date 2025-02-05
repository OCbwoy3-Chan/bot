import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { logger } from "../../lib/Utility";

let genai: GoogleGenerativeAI | null = null;
let file_manager: GoogleAIFileManager | null = null;

export function initGemini(apiKey: string): GoogleGenerativeAI {
	logger.info(
		`Creating new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY)`
	);
	genai = new GoogleGenerativeAI(apiKey);
	file_manager = new GoogleAIFileManager(apiKey);
	return genai;
}

export function getGeminiInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
}

export function getFileManagerInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
}

export function areGenAIFeaturesEnabled(): boolean {
	return genai ? true : false;
}

export const AllModels: { [a: string]: { m: string; t: string } } = {

	// GEMINI 2.0
	// "Gemini 2.0 Flash Thinking Experimental 01-21": { m: "gemini-2.0-flash-thinking-exp-01-21", t: "1mil" },
	// TODO - Add Gemini 2.0 models here when native tool support is avaiable

	// GEMINI 1.5

	"Gemini 1.5 Pro": { m: "gemini-1.5-pro", t: "2mil" },
	"Gemini 1.5 Flash": { m: "gemini-1.5-flash", t: "1mil" },
	"Gemini 1.5 Flash 8B": { m: "gemini-1.5-flash-8b", t: "1mil" },

	// PREVEIEW

	"Gemini 2.0 Flash Experimental": { m: "gemini-2.0-flash-exp", t: "1mil" },
	"Gemini Experimental 1206": { m: "gemini-exp-1206", t: "2mil" },
	"LearnLM 1.5 Pro Experimental": { m: "learnlm-1.5-pro-experimental", t: "32k" },

};
