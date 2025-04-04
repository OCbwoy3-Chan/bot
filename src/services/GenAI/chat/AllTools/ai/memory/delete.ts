import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../../tools";
import { prisma } from "../../../../../Database/db";

const meta: FunctionDeclaration = {
	name: "memory.delete",
	description:
		"Deletes a memory about the currently asking user from CurrentContext using an entry ID.",
	parameters: {
		required: ["id"],
		type: SchemaType.OBJECT,
		description: "memory.delete parameters",
		properties: {
			id: {
				description: "The ID of the memory to delete.",
				type: SchemaType.STRING
			}
		}
	}
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
	if (memories.length >= 30) {
		return {
			error: "You can have a maximum of 30 memories per user"
		};
	}

	const newMemory = await prisma.oCbwoy3ChanAI_UserMemory.delete({
		where: {
			id: args.id,
			AND: {
				user: userId
			}
		}
	});

	return {
		user: userId,
		memory_deleted: {
			entry_id: args.memory
		}
	};
}

registerTool(func, meta);
