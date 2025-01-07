import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { RegularResults, search } from "@navetacandra/ddg";
import { registerTool } from "../tools";
import { $ } from "bun";
import { hostname } from "os";

const meta: FunctionDeclaration = {
	name: "getMusic",
	description: "Gets the song currently being listened by OCbwoy3 (the user).",
};

async function func(args: any): Promise<any> {
	return {
		title: await $`playerctl metadata xesam:title`.text(),
		artist: (await $`playerctl metadata xesam:artist`.text())
			.split(", ")
			.map((a) => a.split(" & "))
			.flatMap((a) => a),
		album: await $`playerctl metadata xesam:album`.text(),
		// genre: await $`playerctl metadata xesam:genre`.text(),
	};
}

if (hostname() === "ocbwoy3-pc") {
	registerTool(func, meta);
}
