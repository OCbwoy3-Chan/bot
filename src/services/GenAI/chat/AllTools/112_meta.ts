import { FunctionDeclaration } from "@google/generative-ai";
import { addTest } from "../tools";
import { getAllGbanProviders } from "@db/GBanProvider";
import { execSync } from "child_process";
import { getRegisteredFederatedInstances } from "@db/federation";
import { hostname } from "os";
import { cwd } from "process";

const meta: FunctionDeclaration = {
	name: "sys.version",
	description:
		"Gets the metadata about the current version 112, including the version, commit, node_env, gban providers, hostname, current working dir and federating instances",
};

addTest(meta.name, {
	userid: null
});

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const version = execSync("git describe --tags").toString().trim();
const commit = execSync("git rev-parse HEAD").toString().trim();

async function func(args: any): Promise<any> {
	return {
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
		gbanProviders: getAllGbanProviders().map(a=>a.name),
		federatingGbanProviders: getRegisteredFederatedInstances().map(a=>a.name)
	};
}


