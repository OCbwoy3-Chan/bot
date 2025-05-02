import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";

import { client } from "services/Bot/bot";
import { GuildNSFWLevel } from "discord.js";

const meta: FunctionDeclaration = {
	name: "discord.resolve_invite",
	description:
		"Resolves a Discord Invite (basically the code part of discord.gg/code or discord.com/invite/code)",
	parameters: {
		required: [],
		type: SchemaType.OBJECT,
		description: "resolveDiscordInvite parameters",
		properties: {
			code: {
				description: "The invite code.",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	url: "darktru"
});

async function func(args: any): Promise<any> {
	const i = await client.fetchInvite(args.code as string);

	return {
		guild: i.guild
			? {
					name: i.guild.name,
					id: i.guild.id,
					features: i.guild.features,
					nsfwLevel:
						i.guild.nsfwLevel === GuildNSFWLevel.Default
							? null
							: i.guild.nsfwLevel === GuildNSFWLevel.Safe
								? "safe"
								: i.guild.nsfwLevel === GuildNSFWLevel.Explicit
									? "explicit"
									: i.guild.nsfwLevel ===
										  GuildNSFWLevel.AgeRestricted
										? "age_restricted"
										: "unknown",
					numNitroBoosters: i.guild.premiumSubscriptionCount,
					vanityInviteCode: i.guild.vanityURLCode,
					description: i.guild.description
				}
			: null,
		members: i.memberCount,
		invitedBy: i.inviter
			? {
					name: i.inviter.displayName,
					username: i.inviter.username,
					id: i.inviter.id
				}
			: null,
		json: i.toJSON()
	};
}

registerTool(func, meta);
