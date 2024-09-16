import { PlayerInfo } from "noblox.js";
import { getDistroName, measureCPULatency } from "../lib/Utility";
import { GetBanData } from "../services/Database/db";
import { RobloxUserBan } from "@prisma/client";

export const infoCommand = {
	genContent: async(roundTrip: string, gatewayPing: string)=>{
		const distro = await getDistroName()
		const wtf = process.hrtime()
		// 1000000
		const cpuLatency = (wtf[0] / 1000000000 + wtf[1] / 1000000)

		return [
			`> # [ocbwoy3.dev](<https://ocbwoy3.dev>) (${distro.match(/^[a-zA-Z ]+/)?.[0].trim()})`,
			`> 112 - GayestSB`,
			`> -# **NodeJS Runtime:** ${process.version}`,
			`> -# **Gateway Latency:** ${gatewayPing}ms`,
			`> -# **Network Latency:** ${roundTrip}ms`,
			`> -# **CPU Latency:** ${measureCPULatency()}μs`
		].join('\n')
	}
}

export const banningCommands = {
	errors: {
		userAlreadyBanned: (name: string) => `${name} is already banned!`,
		userNotBanned: (name: string) => `${name} is not banned!`,
		usernameResolveFail: () => "Failed to resolve input to a valid Roblox player."
	},
	success: {
		userBanSuccessMessage: (name: string) => `${name} has been banned!`,
		userUnbanSuccessMessage: (name: string) => `${name} has been unbanned!`,
		lookupResultMessage: async(d: PlayerInfo, i: number) => {
			let ap = "";
			const bd: RobloxUserBan | null = await GetBanData(i.toString())
			if (bd) {
				ap = `

> **Banned from:** \`${bd.bannedFrom}\`
> **Moderator:** <@${bd.moderatorId}>
> **Reason:** ${bd.reason}
> **Cause:** \`${bd.nature}\`
> **Unbanned:** ${bd.bannedUntil === "-1" ? "never" : `<t:${parseInt(bd.bannedUntil)}>`}`
			}
			return `> # [${d.displayName} (@${d.username})](https://fxroblox.com/users/${i})
> **${d.friendCount}** friends
> **${d.followerCount}** followers
> **${d.followingCount}** following${ap}`; }
	},
	lookups: {
		lookupWebsiteLink: (name: string) => `https://ocbwoy3.dev/lookup?u=${name}`,
		lookupBanReason: (reason: string) => `Reason: ${reason}`,
		lookupBanCause: (cause: string) => `Banned for ${cause}`
	}
}
