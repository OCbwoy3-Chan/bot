import { FunctionDeclaration } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { prisma } from "../../../Database/db";

const meta: FunctionDeclaration = {
	name: "memory.get",
	description: "Retrieves stored memory about the currently asking user from CurrentContext.",
};

addTest(meta.name, null);

type AIContext = {
	askingUserId: string;
	chatbotUserId: string;
	currentAiModel: string;
	currentChannel: string;
	currentUserStatusOrWhatTheUserIsDoingListeningToEtc: any;
	currentServer: any;
	currentChannelM: any;
	[a: string]: any;
};

async function func(args: any, ctx: AIContext): Promise<any> {
	const userId = ctx.askingUserId as string;
	const memories = await prisma.oCbwoy3ChanAI_UserMemory.findMany({
		where: {
			user: userId
		}
	});
	return {
		user: userId,
		memories: memories.map(a => {
			return {
				id: a.id,
				data: a.memory
			}
		})
	}
}

registerTool(func, meta);
