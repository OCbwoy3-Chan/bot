import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { prisma } from "../../../Database/db";

const meta: FunctionDeclaration = {
	name: "memory.add",
	description: "Adds a memory about the currently asking user from CurrentContext.",
	parameters: {
			required: ["memory"],
			type: SchemaType.OBJECT,
			description: "memory.add parameters",
			properties: {
				memory: {
					description:
						"The memory to save (e.g. Likes Concise Responses, etc.).",
					type: SchemaType.STRING,
				}
			},
		},
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
	if (memories.length >= 40) {
		return {
			error: "You can have a maximum of 40 memories per user."
		}
	}

	const newMemory = await prisma.oCbwoy3ChanAI_UserMemory.create({
		data: {
			user: userId,
			memory: args.memory
		}
	});

	return {
		user: userId,
		memory_added: {
			new_entry_id: newMemory.id
		}
	}
}

registerTool(func, meta);
