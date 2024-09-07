import getos, { LinuxOs, OtherOs } from "getos"
import { arch, platform } from "os"

export const infoCommand = {
	usedFields: [ "DISTRO", "ARCH", "CPUINFO", "MEMINFO", "USERNAME", "HOSTNAME", "UPTIME", "NODE_VER", "GATEWAY_LATENCY", "NETWORK_LATENCY", "PROXY_LATENCY", "CPU_LATENCY" ],
	genContent: async()=>{
		const distro = await new Promise((resolve)=>{
			try {
				getos((e,os:LinuxOs|OtherOs)=>{
					if (e) {
						resolve(platform());
						return;
					}
					if (typeof(os)==="string") {
						resolve(os);
						return;
					}
					resolve((os as LinuxOs).dist);
				})
			} catch {
				resolve(platform());
			}
		})
		return [
			`> # [ocbwoy3.dev](<https://ocbwoy3.dev>) (${distro}, ${arch()})`,
			`> -# **NodeJS Runtime:** ${process.version}`,
			`> -# **Gateway Latency:** @GATEWAY_LATENCY`,
			`> -# **Network Latency:** @NETWORK_LATENCY`,
			`> -# **Proxy Latency:** @PROXY_LATENCY`,
			`> -# **CPU Latency:** @CPU_LATENCY`
		].join('\n')
	}
}
