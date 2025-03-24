import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { client } from "../../../Bot/bot";
import { addTest, registerTool } from "../tools";
import { Channel } from "discord.js";
import { AIContext } from "..";

const meta: FunctionDeclaration = {
	name: "discord.get_user",
	description: "Retrieves detailed information about a Discord user.",
	parameters: {
		required: ["id"],
		type: SchemaType.OBJECT,
		description: "getDiscordUser parameters",
		properties: {
			id: {
				description: "The Discord User's ID.",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	id: "486147449703104523"
});

async function func(args: any, ctx: AIContext): Promise<any> {
	const id = args.id as string;

	let ch: Channel | null = client.channels.resolve(ctx.currentChannelM);
	if (!ch) {
		ch = await client.channels.fetch(ctx.currentChannel);
	}
	if (!ch || ch.isDMBased()) {
		const u = await client.users.fetch(id);

		return {
			name: u.displayName,
			id: u.id,
			userJson: u.toJSON()
		};
	}

	const a = await ch.guild.members.fetch(id);

	// console.log(u);
	return {
		username: a.user.username,
		displayName: a.nickname || a.displayName,
		id: a.user.id,
		isBot: a.user.bot,
		timedOutUntil: a.communicationDisabledUntilTimestamp,
		presence: a.presence?.toJSON(),
		hasDiscordNitroSince: a.premiumSinceTimestamp,
		joinedAt: a.joinedTimestamp,
		nameColorHex: a.displayHexColor,
		roles: a.roles.cache.map((b) => ({
			name: b.name,
			color: b.hexColor,
			id: b.id
		}))
	};
}

registerTool(func, meta);
