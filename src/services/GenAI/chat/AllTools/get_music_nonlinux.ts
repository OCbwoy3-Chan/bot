import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { RegularResults, search } from "@navetacandra/ddg";
import { registerTool } from "../tools";
import { $ } from "bun";
import { hostname } from "os";
import { getPresence } from "../../../Server/router/stats";

const meta: FunctionDeclaration = {
	name: "getStatus",
	description: "Gets OCbwoy3's (the user's) Rich Presence. Includes Music, Roblox status, etc..",
};

async function func(args: any): Promise<any> {
	return getPresence();
}

if (hostname() !== "ocbwoy3-pc") {
	registerTool(func, meta);
}
