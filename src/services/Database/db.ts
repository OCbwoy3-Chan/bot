import { logger } from "@112/Utility";
import { PrismaClient } from "@prisma/client";
import { platform } from "os";

function _createPrisma(): PrismaClient {
	const st = performance.now();
	let c = new PrismaClient();
	const stt = performance.now();
	if ((stt-st) > 250) {
		logger.warn(`DB took ${Math.ceil(stt-st)}ms to start.${platform() === "win32" ? " This is YOUR fault for using W*ndows." : ""}`)
	}
	return c
}

export const prisma = _createPrisma();
