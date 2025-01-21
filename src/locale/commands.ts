import { HarmCategory } from "@google/generative-ai";
import { RobloxUserBan } from "@prisma/client";
import { PlayerInfo } from "noblox.js";
import { getDistroName, measureCPULatency } from "../lib/Utility";
import { GetBanData } from "../services/Database/helpers/RobloxBan";

export const infoCommand = {
	genContent: async (roundTrip: string, gatewayPing: string) => {
		const distro = await getDistroName();
		const wtf = process.hrtime();
		// 1000000
		const cpuLatency = wtf[0] / 1000000000 + wtf[1] / 1000000;

		return [
			`> # [ocbwoy3.dev](<https://ocbwoy3.dev>) (${distro.trim()})`,
			`> [**112, GayestSB**](<https://github.com/ocbwoy3/112>)`,
			`> -# **\`process.version\`:** ${process.version}`,
			`> -# **Gateway Latency:** ${gatewayPing}ms`,
			`> -# **Network Latency:** ${roundTrip}ms`,
			`> -# **CPU Latency:** ${measureCPULatency()}μs`,
		].join("\n");
	},
};

export const gbanFederation = {
	federationError: (instance: string) => `> Cannot federate to ${instance}`,
	fetchBansError: (instance: string) =>
		`> Failed to fetch bans from ${instance}`,
	userWhitelisted: (plr: string, instance: string) =>
		`> ${plr} is whitelisted on ${instance}`,
	alreadyBanned: (plr: string, instance: string) =>
		`> ${plr} is already banned on ${instance}`,
	bannedByHost: (plr: string, instance: string) =>
		`> ${plr} is banned by the host instance on ${instance}`,
	bannedByRemote: (plr: string, instance: string) =>
		`> ${plr} is banned by a remote instance ${instance}`,
};

export const general = {
	errors: {
		notOwner: (): string => "> Missing permission `BOT_OWNER`",
		missingPermission: (requiredPerm: string): string =>
			`> Missing permission \`${requiredPerm}\``,
		invalidRoleId: (roleId: number): string =>
			`> Invalid Role with ID \`${roleId}\``,
		genai: {
			unsafeRequest: (category: HarmCategory): string => {
				let a = category.toString();
				if (category === HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT)
					a = "Dangerous Content";
				if (category === HarmCategory.HARM_CATEGORY_HARASSMENT)
					a = "Harassment";
				if (category === HarmCategory.HARM_CATEGORY_HATE_SPEECH)
					a = "Hate Speech";
				if (category === HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT)
					a = "Explicit Conent";
				if (category === HarmCategory.HARM_CATEGORY_UNSPECIFIED)
					a = "an unspecified reason";
				return `> [Google GenerativeAI] Message flagged for ${a}.`;
			},
			aiDisabled: (): string => "> Generative AI Features are disabled.",
			ratelimit: (): string => "> API quota exceeded.",
		},
	},
};

export const banningCommands = {
	errors: {
		userAlreadyBanned: (name: string) => `${name} is already banned!`,
		userNotBanned: (name: string) => `${name} is not banned!`,
		usernameResolveFail: () =>
			"Failed to resolve input to a valid Roblox player.",
	},
	success: {
		userBanSuccessMessage: (name: string) => `${name} has been banned!`,
		userUnbanSuccessMessage: (name: string) => `${name} has been unbanned!`,
		lookupResultMessage: async (d: PlayerInfo, i: number) => {
			let ap = "";
			const bd: RobloxUserBan | null = await GetBanData(i.toString());
			if (bd) {
				ap = `

> **Moderator:** <@${bd.moderatorId}>
> **Reason:** ${bd.reason}
> **Unbanned:** ${
					bd.bannedUntil === "-1"
						? "never"
						: `<t:${parseInt(bd.bannedUntil)}>`
				}`;
			}
			return `> # [${d.displayName} (@${
				d.username
			})](https://fxroblox.com/users/${i})
> ${
				d.isBanned
					? "**Account Deleted**"
					: "**Roblox Account**"
			}${ap}`;
		},
	},
	lookups: {
		lookupWebsiteLink: (name: string) =>
			`https://ocbwoy3.dev/lookup?u=${name}`,
		lookupBanReason: (reason: string) => `Reason: ${reason}`,
		lookupBanCause: (cause: string) => `Banned for ${cause}`,
	},
};
