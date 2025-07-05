import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";

import { client } from "services/Bot/bot";
import { GuildNSFWLevel, Invite } from "discord.js";
import axios from "axios";

const meta: FunctionDeclaration = {
	name: "discord.resolve_invite",
	description:
		"Resolves a Discord Invite (basically the code part of discord.gg/code or discord.com/invite/code)",
	parameters: {
		required: ["code"],
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
	code: "darktru"
});

async function func(args: any): Promise<any> {
	const theProfile = JSON.parse(await axios.get(`https://discord.com/api/v9/invites/${args.code}`))
	const i = await client.fetchInvite(`${args.code}`);

	return {
		guild: i.guild
			? {
					name: i.guild.name,
					id: i.guild.id,
					features: i.guild.features,
					indicators: {
						discordPartner: i.guild.features.includes("PARTNERED"), // discord is stupid for discontinuing this
						isVisibleInDiscovery: i.guild.features.includes("DISCOVERABLE"),
						isStudentHub: i.guild.features.includes("HUB") || i.guild.features.includes("LINKED_TO_HUB"),
						isMonetized: i.guild.features.includes("MONETIZATION_ENABLED"),
						isCommunity: i.guild.features.includes("COMMUNITY")
					},
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
					discordNitroBoostCount: i.guild.premiumSubscriptionCount,
					vanityInviteCode: i.guild.vanityURLCode,
					description: i.guild.description,
				}
			: null,
		isTemporary: i.temporary || false,
		maxAge: i.maxAge,
		maxUses: i.maxUses,
		expiresTimestamp: i.expiresTimestamp,
		members: i.memberCount,
		serverProfile: theProfile.profile || null,
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
