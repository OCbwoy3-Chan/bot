import { BskyAgent } from "@atproto/api";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "searchBskyPosts",
	description:
		"Searches Bluesky for posts with the given query. SEARCH TOOL FOR BLUESKY.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "findBskyPosts parameters",
		properties: {
			query: {
				description: "The posts to search for",
				type: SchemaType.STRING,
			},
		},
	},
};

const agent = new BskyAgent({
	service: "https://public.api.bsky.app",
});

async function func(args: any): Promise<any> {
	let query = args.query as string;

	const { data } = await agent.app.bsky.feed.searchPosts({
		q: query,
	});

	return {
		hits: data.hitsTotal,
		posts: data.posts,
	};
}

registerTool(func, meta);
