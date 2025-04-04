import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { $ } from "bun";
import { Channel } from "discord.js";
import { hostname } from "os";
import { AIContext } from "../..";
import { client } from "../../../../Bot/bot";
import { addTest, registerTool } from "../../tools";

const meta: FunctionDeclaration = {
	name: "discord.get_status",
	description:
		"Retrieves the Discord user's status, including activities, music, games, online status, and platform info (e.g., Xbox, PS4, PS5). Additonally gets what the user is listening to, if are.",
	parameters: {
		required: ["id"],
		type: SchemaType.OBJECT,
		description: "getStatus parameters",
		properties: {
			id: {
				description: "The Discord User's ID.",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	id: "486147449703104523"
});

async function funcGetMusic(args: any): Promise<any> {
	const players = (await $`playerctl -l`.text()).split("\n");
	try {
		players.pop();
	} catch {}
	return {
		players,
		title: (await $`playerctl metadata xesam:title`.text()).replace(
			"\n",
			""
		),
		artist: (await $`playerctl metadata xesam:artist`.text())
			.replace("\n", "")
			.split(", ")
			.map((a) => a.split(" & "))
			.flatMap((a) => a),
		genre: (await $`playerctl metadata xesam:genre`.text()).replace(
			"\n",
			""
		),
		album: await (
			await $`playerctl metadata xesam:album`.text()
		).replace("\n", ""),
		mprisTrackId: await (
			await $`playerctl metadata mpris:trackid`.text()
		).replace("\n", "")
		// genre: await $`playerctl metadata xesam:genre`.text(),
	};
}

async function func(args: any, ctx: AIContext): Promise<any> {
	const id = args.id as string;
	const u = await client.users.fetch(id);
	// console.log(u);

	let status: object | string | null = "failed to fetch";

	try {
		const ch: Channel | null = await client.channels.fetch(
			ctx.currentChannel
		);
		if (ch && !ch.isDMBased()) {
			const g = await ch.guild.members.fetch(id);
			status = g.presence?.toJSON() || null;
		}
	} catch {}

	const y: any = {};
	try {
		const x =
			hostname() === "ocbwoy3-pc" && id === `${process.env.OWNER_ID!}`
				? await funcGetMusic({})
				: null;
		if (x) {
			y.music = x;
		}
	} catch {}

	return {
		...y,
		name: u.displayName,
		id: u.id,
		discordStatus: status
	};
}

registerTool(func, meta);
