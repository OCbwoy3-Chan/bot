import { createCommand } from "@112/Command";
import { prisma } from "@db/db";
import { callToolHack } from "@ocbwoy3chanai/chat/tools";
import { AttachmentBuilder, Message } from "discord.js";

// Add a custom replacer function to handle BigInt serialization
const replacer = (key: string, value: any) => {
	return typeof value === "bigint" ? value.toString() : value;
};

export const cmd = createCommand(
	{
		name: "legalexport",
		aliases: [],
		description: "exports the entire db for the police"
	},
	async (m: Message<true>) => {
		if (m.author.id !== process.env.OWNER_ID) return;

		const metadata = {
			botInfo: await callToolHack("sys.metadata"),
			db: await Promise.all(
				Object.entries(prisma)
					.filter(([name]) => !name.startsWith("_"))
					.filter(([name]) => !name.startsWith("$"))
					.map(async ([name, table]) => ({
						name: name,
						data: await table.findMany()
					}))
			)
		};

		return await m.author.send({
			content: "here is the entire db you can send off to the feds!",
			files: [
				new AttachmentBuilder(
					Buffer.from(JSON.stringify(metadata, replacer, "\t")),
					{
						name: "db.json"
					}
				)
			]
		});
	}
);
