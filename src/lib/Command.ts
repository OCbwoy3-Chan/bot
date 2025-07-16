// remX

import { Args, Command } from "@sapphire/framework";
import { Message, PartialGroupDMChannel } from "discord.js";
import { logger } from "./Utility";

type CreateCommandParams = {
	name: string;
	aliases: string[];
	description: string;
	nsfw?: boolean;
	cooldown?: {
		limit?: number;
		delay?: number;
	};
	howto?: string;
};

type MessageFunction = (message: Message<true>, a: Args) => Promise<any> | any;

let allCommands: { name: string; aliases: string[]; description: string }[] =
	[];

export function createCommand(
	{
		name,
		aliases,
		description,
		cooldown,
		...createParams
	}: CreateCommandParams,
	func: MessageFunction
): typeof Command | any {
	allCommands.push({
		name: createParams.howto || name,
		aliases,
		description,
	});
	class Extended extends Command {
		constructor(context: Command.Context, options: Command.Options = {}) {
			super(context, {
				...options,
				name,
				aliases,
				description,
				nsfw: createParams.nsfw,
				cooldownDelay: cooldown?.delay || 200,
				cooldownLimit: cooldown?.limit || 1,
			});
		}

		public async messageRun(message: Message, args: Args) {
			if (message.channel instanceof PartialGroupDMChannel) return;
			if (!message.guild) return;

			logger.info(
				`${message.author.displayName} (${message.author.username}) ran ${message.content}`
			);

			await func(message as Message<true>, args);
		}
	}
	return Extended;
}

export async function getAllCommands() {
	return allCommands;
}
