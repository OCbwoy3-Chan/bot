import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { client } from "../../../Bot/bot";
import { AIContext } from "..";
import { Channel } from "discord.js";
import { $ } from "bun";
import { hostname } from "os";

const meta: FunctionDeclaration = {
	name: "getStatus",
	description:
		"Gets the given user's discord status which includes the current activities, music, games, online status (including platforms where), etc. embedded = discord on xbox/ps4/ps5",
	parameters: {
		required: ["id"],
		type: SchemaType.OBJECT,
		description: "getStatus parameters",
		properties: {
			id: {
				description: "The Discord User's ID.",
				type: SchemaType.STRING,
			},
		},
	},
};

async function funcGetMusic(args: any): Promise<any> {
	return {
		title: await $`playerctl metadata xesam:title`.text(),
		artist: (await $`playerctl metadata xesam:artist`.text())
			.split(", ")
			.map((a) => a.split(" & "))
			.flatMap((a) => a),
		album: await $`playerctl metadata xesam:album`.text(),
		mprisTrackId: await $`playerctl metadata mpris:trackid`.text(),
		// genre: await $`playerctl metadata xesam:genre`.text(),
	};
}

if (hostname() === "ocbwoy3-pc") {
	registerTool(func, meta);
}


async function func(args: any, ctx: AIContext): Promise<any> {
	const id = args.id as string;
	const u = await client.users.fetch(id);
	// console.log(u);

	let status: Object | null = "failed to fetch"

	try {
		const ch: Channel | null = await client.channels.fetch(ctx.currentChannel)
		if (ch && !ch.isDMBased()) {
			const g = await ch.guild.members.fetch(id)
			status = g.presence?.toJSON() || null;
		}
	} catch {}

	let x = (hostname() === "ocbwoy3-pc" && id === `${process.env.OWNER_ID!}`) ? await funcGetMusic({}) : null
	let y: any = {}
	if (x) {
		y.music = x;
	}

	return {
		...y,
		name: u.displayName,
		id: u.id,
		discordStatus: status,
	};
}

registerTool(func, meta);
