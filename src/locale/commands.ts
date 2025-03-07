import { HarmCategory } from "@google/generative-ai";
import { RobloxUserBan } from "@prisma/client";
import { PlayerInfo } from "noblox.js";
import { getDistroNameSync, isFork, measureCPULatency } from "../lib/Utility";
import { GetBanData } from "../services/Database/helpers/RobloxBan";
import { prisma } from "@db/db";
import { freemem, totalmem, uptime } from "os";

const distro = getDistroNameSync()

export const infoCommand = {
	genContent: async (roundTrip: string, gatewayPing: string) => {
		const upd = uptime();
		const days = Math.floor(upd / 86400);
		const hours = Math.floor((upd % 86400) / 3600);
		const minutes = Math.floor((upd % 3600) / 60);
		const seconds = Math.floor(upd % 60);
		const uptimeStr = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

		const totalMemoryGB = Math.round(totalmem() / 1024 / 1024 / 1024 * 100) / 100;
		const usedMemoryGB = Math.round(freemem() / 1024 / 1024 / 1024 * 100) / 100;

		return [
			// :flag_${getCurrentCountryCode().toLowerCase()}:
			`> # [ocbwoy3.dev](<https://ocbwoy3.dev>) (${distro}) ${isFork() ? `\n> ***FORKED VERSION OF 112***` : ""}`,
			`> -# **Gateway Lat:** ${gatewayPing}ms`,
			`> -# **Network Lat:** ${roundTrip}ms`,
			`> -# **CPU Lat:** ${measureCPULatency()}μs`,
			`> -# **Uptime:** ${uptimeStr}`,
			`> -# **Memory:** ${usedMemoryGB}/${totalMemoryGB} GB`,
			`> -# **Banned Users:** ${(await prisma.robloxUserBan.findMany()).length}`,
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
		notOwner: (): string => "> You are not the owner of this bot!",
		missingPermission: (requiredPerm: string): string =>
			`> Missing permission \`${requiredPerm}\``,
		invalidRoleId: (roleId: number): string =>
			`> Invalid Role with ID \`${roleId}\``,
		genai: {
			illegalInEurope: (): string => "> AI Moderation is illegal in the European Union.",
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
		ownerHackbanOnly: () => "Only the bot owner can hack-ban!" // totally not stolen from wickbot
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
> **Unbanned:** ${bd.bannedUntil === "-1"
						? "never"
						: `<t:${parseInt(bd.bannedUntil)}>`
					}`;
			}
			return `> # [${d.displayName} (@${d.username
				})](https://fxroblox.com/users/${i})
> ${d.isBanned
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
