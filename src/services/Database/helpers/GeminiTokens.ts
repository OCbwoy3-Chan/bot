import { logger } from "@112/Utility";
import { prisma } from "../db";

export type GeminiTokenEntry = {
	name: string;
	token: string;
};

export async function GetGeminiTokens(): Promise<GeminiTokenEntry[]> {
	return prisma.geminiApiToken.findMany({
		orderBy: {
			name: "asc"
		}
	});
}

export async function GetGeminiTokenByName(
	name: string
): Promise<GeminiTokenEntry | null> {
	return prisma.geminiApiToken.findUnique({
		where: {
			name
		}
	});
}

export async function AddGeminiToken(
	name: string,
	token: string
): Promise<void> {
	const existingToken = await prisma.geminiApiToken.findUnique({
		where: { name }
	});
	if (existingToken) {
		throw "Token name already exists";
	}
	logger.info(`[GEMINI TOKEN ADD] ${name}`);
	await prisma.geminiApiToken.create({
		data: {
			name,
			token
		}
	});
}

export async function RemoveGeminiToken(name: string): Promise<void> {
	const existingToken = await prisma.geminiApiToken.findUnique({
		where: { name }
	});
	if (!existingToken) {
		throw "Token name not found";
	}
	logger.info(`[GEMINI TOKEN REMOVE] ${name}`);
	await prisma.geminiApiToken.delete({
		where: {
			name
		}
	});
}
