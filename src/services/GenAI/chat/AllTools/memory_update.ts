import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { prisma } from "../../../Database/db";

const meta: FunctionDeclaration = {
	name: "memory.update",
	description: "Updated a specific memory about the currently asking user from CurrentContext via a entry ID.",
	parameters: {
			required: ["id", "memory"],
			type: SchemaType.OBJECT,
			description: "memory.update parameters",
			properties: {
				id: {
					description:
						"The ID of the memory to update.",
					type: SchemaType.STRING,
				},
				memory: {
					description:
						"The updated memory to save (e.g. Likes Concise Responses, etc.).",
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
	const newMemory = await prisma.oCbwoy3ChanAI_UserMemory.update({
		where: {
			id: args.id,
			AND: {
				user: ctx.askingUserId
			}
		},
		data: {
			memory: args.memory
		}
	});

	return {
		user: userId,
		memory_updated: {
			entry_id: newMemory.id
		}
	}
}

registerTool(func, meta);
