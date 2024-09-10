import { readFileSync } from "fs";
import { arch, platform } from "os";
import { getDistroName, measureCPULatency } from "../lib/Utility";

export const infoCommand = {
	genContent: async(roundTrip: string, gatewayPing: string)=>{
		const distro = await getDistroName()
		const wtf = process.hrtime()
		// 1000000
		const cpuLatency = (wtf[0] / 1000000000 + wtf[1] / 1000000)

		return [
			`> # [ocbwoy3.dev](<https://ocbwoy3.dev>) (${distro}, ${arch()})`,
			`> -# **NodeJS Runtime:** ${process.version}`,
			`> -# **Gateway Latency:** ${gatewayPing}ms`,
			`> -# **Network Latency:** ${roundTrip}ms`,
			`> -# **CPU Latency:** ${measureCPULatency()}μs`
		].join('\n')
	}
}
