import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { client } from "../../../Bot/bot";
import { addTest, registerTool } from "../tools";
import { AIContext } from "..";
import { Channel } from "discord.js";

const meta: FunctionDeclaration = {
	name: "discord.search_members",
	description: "Searches for Discord users in the current server.",
	parameters: {
		required: ["name"],
		type: SchemaType.OBJECT,
		description: "getDiscordUser parameters",
		properties: {
			name: {
				description:
					"The User's name or username (case-insensitive, can match partial, 30 max)",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	name: "ocbwoy3"
});

async function func(args: any, ctx: AIContext): Promise<any> {
	const name = args.name as string;
	if (!ctx.currentChannel) {
		return {
			error: "This feature cannot be used in DMs."
		};
	}
	let ch: Channel | null = client.channels.resolve(ctx.currentChannelM);
	if (!ch) {
		ch = await client.channels.fetch(ctx.currentChannel);
	}
	if (!ch || ch.isDMBased()) {
		return {
			error: "This feature cannot be used in DMs."
		};
	}

	const members = await ch.guild.members.search({
		query: name,
		limit: 30
	});

	return {
		members: members.map((a) => {
			// console.log(a.roles.cache.map(b => ({ name: b.name, color: b.hexColor, id: b.id })))
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
		})
	};
}

registerTool(func, meta);
