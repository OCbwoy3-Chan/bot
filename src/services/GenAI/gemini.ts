import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { readFileSync } from "fs";
import { logger } from "../../lib/Utility";
import { join } from "path";
import { readFile } from "fs/promises";

let genai: GoogleGenerativeAI | null = null;
let file_manager: GoogleAIFileManager | null = null;

export function initGemini(apiKey: string): GoogleGenerativeAI {
	logger.info(`Creating new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY)`);
	genai = new GoogleGenerativeAI(apiKey);
	file_manager = new GoogleAIFileManager(apiKey);
	return genai;
};

export function getGeminiInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
};

export function getFileManagerInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
};

export function areGenAIFeaturesEnabled(): boolean {
	return genai ? true : false;
}
