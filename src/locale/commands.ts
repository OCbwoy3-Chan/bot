import { readFileSync } from "fs";
import getos, { LinuxOs, OtherOs } from "getos";
import { arch, platform } from "os";
import { measureCPULatency } from "../shared/CPULatencyCheck";

export const infoCommand = {
	usedFields: [ "DISTRO", "ARCH", "CPUINFO", "MEMINFO", "USERNAME", "HOSTNAME", "UPTIME", "NODE_VER", "GATEWAY_LATENCY", "NETWORK_LATENCY", "PROXY_LATENCY", "CPU_LATENCY" ],
	genContent: async(roundTrip: string, gatewayPing: string)=>{
		const distro = await new Promise((resolve)=>{
			try {
				const d = readFileSync("/etc/os-release").toString().split("\n")
				d.forEach((a:string)=>{
					if (a.startsWith("PRETTY_NAME=")) {
						resolve(a.replace(/^PRETTY_NAME="/,'').replace(/(\(.*\))?"$/,'').trim())
					}
				})
				resolve("Unknown Distro")
			} catch {
				resolve(platform());
			}
		})
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
