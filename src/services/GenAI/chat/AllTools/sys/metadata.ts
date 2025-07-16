import { FunctionDeclaration } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";
import { getAllGbanProviders } from "@db/GBanProvider";
import { execSync } from "child_process";
import { getRegisteredFederatedInstances } from "@db/federation";
import { hostname, platform } from "os";
import { cwd } from "process";
import { getDistroNameSync } from "@112/Utility";

import { _libocbwoy3Version } from "@ocbwoy3/libocbwoy3/dist/constants";
import libocbwoy3PackageJson from "@ocbwoy3/libocbwoy3/package.json";

const meta: FunctionDeclaration = {
	name: "sys.metadata",
	description:
		"Gets the metadata about the current bot's version, including the branch, version, commit, node_env, libocbwoy3 version metadata, gban providers, hostname, device details, current working dir, federated/federating instances and more!"
};

addTest(meta.name, {
	userid: null
});

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const version = execSync("git describe --tags").toString().trim();
const commit = execSync("git rev-parse HEAD").toString().trim();

async function func(args: any): Promise<any> {
	return {
		device: {
			operatingSystem: getDistroNameSync(),
			platform: platform()
		},
		libocbwoy3: {
			version: _libocbwoy3Version,
			npmVersion: libocbwoy3PackageJson.version,
			package: libocbwoy3PackageJson.name,
			npmUrl: `https://www.npmjs.com/package/${libocbwoy3PackageJson.name}`
		},
		runtime: {
			hostname: hostname(),
			cwd: cwd(),
			node_env: process.env.NODE_ENV || "undefined"
		},
		version: {
			branch,
			version,
			commit
		},
		gbanProviders: getAllGbanProviders().map((a) => a.name),
		federatingGbanProviders: getRegisteredFederatedInstances().map(
			(a) => a.name
		)
	};
}

registerTool(func, meta);
